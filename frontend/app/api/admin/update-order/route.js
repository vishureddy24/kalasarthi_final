import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'kalasarthi')
  }
  return db
}

// Verify admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split('Bearer ')[1]
  
  try {
    const admin = require('firebase-admin')
    const decoded = await admin.auth().verifyIdToken(token)
    if (decoded.email !== 'vishureddy2401@gmail.com') return null
    return decoded
  } catch (err) {
    return null
  }
}

export async function POST(request) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const database = await connectToMongo()
    const body = await request.json()
    const { orderId, status, trackingInfo } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 })
    }

    // Valid status values
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Find order
    const order = await database.collection('orders').findOne({ id: orderId })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order with tracking info
    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    }

    // Add tracking update to timeline
    const timelineEntry = {
      status,
      time: new Date().toISOString(),
      ...(trackingInfo && { trackingInfo })
    }

    // If tracking info provided, add it
    if (trackingInfo) {
      updateData.trackingInfo = trackingInfo
      updateData.timeline = [...(order.timeline || []), timelineEntry]
    } else {
      updateData.timeline = [...(order.timeline || []), timelineEntry]
    }

    await database.collection('orders').updateOne(
      { id: orderId },
      { $set: updateData }
    )

    // Notify buyer about status update
    if (order.userEmail && status !== order.status) {
      try {
        const { sendEmail } = await import('@/lib/sendEmail')
        
        const statusMessages = {
          processing: 'Your order is being prepared by our artisans',
          shipped: `Your order has been shipped! ${trackingInfo?.trackingNumber ? `Tracking: ${trackingInfo.trackingNumber}` : ''}`,
          out_for_delivery: 'Your order is out for delivery today',
          delivered: 'Your order has been delivered! We hope you love it 🎉'
        }

        if (statusMessages[status]) {
          await sendEmail(
            order.userEmail,
            `Order ${status.charAt(0).toUpperCase() + status.slice(1)} - #${orderId.slice(-8)}`,
            `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #6B1F2B;">KalaSarthi</h1>
                <h2>Order Update</h2>
                <p>Hi ${order.userName || 'Customer'},</p>
                <p>${statusMessages[status]}</p>
                <p><strong>Order ID:</strong> ${orderId}</p>
                ${trackingInfo?.trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingInfo.trackingNumber}</p>` : ''}
                ${trackingInfo?.courier ? `<p><strong>Courier:</strong> ${trackingInfo.courier}</p>` : ''}
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/orders" 
                   style="background: #6B1F2B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
                  Track Order
                </a>
              </div>
            `
          )
        }
      } catch (emailErr) {
        console.error('Failed to send status update email:', emailErr)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order status updated',
      order: { ...order, ...updateData }
    })

  } catch (err) {
    console.error('Update order error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
