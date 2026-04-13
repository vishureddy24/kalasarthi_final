import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { MongoClient } from 'mongodb'
import { sendOrderConfirmationEmailWithInvoice, sendOrderNotificationToArtisan } from '@/lib/sendEmail'
import { generateInvoice } from '@/lib/generateInvoice'

// MongoDB connection
let client
let db
let connectionPromise = null

async function connectToMongo() {
  if (db) return db
  
  if (connectionPromise) {
    return connectionPromise
  }
  
  connectionPromise = (async () => {
    try {
      if (!process.env.MONGO_URL) {
        throw new Error('MONGO_URL environment variable is not set')
      }
      
      if (!client) {
        client = new MongoClient(process.env.MONGO_URL, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
        })
        await client.connect()
        db = client.db(process.env.DB_NAME || 'kalasarthi')
        console.log('Webhook MongoDB connected')
      }
      return db
    } catch (err) {
      console.error('Webhook MongoDB connection error:', err.message)
      client = null
      db = null
      connectionPromise = null
      throw err
    }
  })()
  
  return connectionPromise
}

export async function POST(req) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_secret')
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log('Webhook received:', event.event)

    const database = await connectToMongo()

    // Handle payment captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      console.log('Payment captured for order:', orderId)

      // Find order by Razorpay order ID
      const order = await database.collection('orders').findOne({ 
        razorpayOrderId: orderId 
      })

      if (!order) {
        console.error('Order not found:', orderId)
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      // Prevent duplicate processing
      if (order.status === 'paid') {
        console.log('Order already processed:', orderId)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Update order status
      await database.collection('orders').updateOne(
        { razorpayOrderId: orderId },
        {
          $set: {
            status: 'paid',
            razorpayPaymentId: payment.id,
            razorpaySignature: payment.signature,
            paidAt: new Date().toISOString(),
            timeline: [
              ...(order.timeline || []),
              { status: 'paid', time: new Date().toISOString() }
            ]
          }
        }
      )

      console.log('Order updated to paid:', orderId)

      // Send confirmation email to buyer with invoice (only once)
      if (!order.emailSent && order.userEmail) {
        try {
          // Generate invoice PDF
          const { filePath } = await generateInvoice(order)
          console.log('Invoice generated:', filePath)
          
          // Send email with invoice attachment
          await sendOrderConfirmationEmailWithInvoice(order, order.userEmail, order.userName || 'Customer', filePath)
          
          await database.collection('orders').updateOne(
            { razorpayOrderId: orderId },
            { 
              $set: { 
                emailSent: true, 
                emailSentAt: new Date().toISOString(),
                invoiceGenerated: true,
                invoicePath: filePath
              } 
            }
          )
          console.log('Confirmation email with invoice sent to:', order.userEmail)
        } catch (emailErr) {
          console.error('Failed to send confirmation email:', emailErr)
          // Fallback: try without invoice
          try {
            await sendOrderConfirmationEmailWithInvoice(order, order.userEmail, order.userName || 'Customer', null)
            console.log('Confirmation email sent without invoice')
          } catch (fallbackErr) {
            console.error('Fallback email also failed:', fallbackErr)
          }
        }
      }

      // Send notifications to artisans
      for (const item of order.items || []) {
        if (item.artisanId) {
          try {
            // Get artisan details
            const artisan = await database.collection('users').findOne({ id: item.artisanId })
            
            if (artisan?.email) {
              await sendOrderNotificationToArtisan(
                item,
                artisan.email,
                artisan.displayName || 'Artisan',
                { orderId: order.id }
              )
              console.log('Notification sent to artisan:', artisan.email)
            }

            // Create in-app notification
            await database.collection('notifications').insertOne({
              id: crypto.randomUUID(),
              userId: item.artisanId,
              message: `New order received! ${item.title} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`,
              type: 'order',
              orderId: order.id,
              read: false,
              createdAt: new Date().toISOString()
            })
          } catch (notifyErr) {
            console.error('Failed to notify artisan:', notifyErr)
          }
        }
      }

      // Clear user's cart
      await database.collection('cart').updateOne(
        { userId: order.userId },
        { $set: { items: [], totalAmount: 0, updatedAt: new Date().toISOString() } }
      )

      return NextResponse.json({ success: true, message: 'Payment processed' })
    }

    // Handle payment failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id

      console.log('Payment failed for order:', orderId)

      await database.collection('orders').updateOne(
        { razorpayOrderId: orderId },
        {
          $set: {
            status: 'failed',
            failureReason: payment.error_description || 'Payment failed',
            updatedAt: new Date().toISOString()
          }
        }
      )

      return NextResponse.json({ success: true, message: 'Payment failure recorded' })
    }

    // Handle other events
    console.log('Unhandled webhook event:', event.event)
    return NextResponse.json({ success: true, message: 'Event received' })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// Disable body parsing for raw body access
export const config = {
  api: {
    bodyParser: false,
  },
}
