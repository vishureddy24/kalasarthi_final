export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { MongoClient, ObjectId } from 'mongodb'
import { generateInvoicePDF } from '@/lib/generateInvoice'

const MONGO_URL = process.env.MONGO_URL
const DB_NAME = process.env.DB_NAME || 'kalasarthi'

// Firebase Admin initialization
let adminAuth
try {
  const admin = require('firebase-admin')
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  }
  adminAuth = admin.auth()
} catch (e) {
  console.error('Firebase Admin initialization error:', e.message)
}

// Verify Firebase token
async function verifyAuth(request) {
  if (!adminAuth) return null
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split('Bearer ')[1]
  try {
    return await adminAuth.verifyIdToken(token)
  } catch {
    return null
  }
}

async function connectDB() {
  const client = new MongoClient(MONGO_URL)
  await client.connect()
  return { client, db: client.db(DB_NAME) }
}

export async function GET(request, { params }) {
  try {
    // Verify authentication
    const decoded = await verifyAuth(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    console.log('Invoice request for order ID:', id, 'User:', decoded.uid)
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Connect to database
    const { client, db } = await connectDB()

    // Fetch order - support both ObjectId and UUID formats
    let order = null
    
    // Try as custom UUID first (most orders use this)
    order = await db.collection('orders').findOne({ 
      id: id,
      userId: decoded.uid
    })
    
    // If not found, try as MongoDB ObjectId
    if (!order) {
      try {
        order = await db.collection('orders').findOne({ 
          _id: new ObjectId(id),
          userId: decoded.uid
        })
      } catch (e) {
        console.log('Not a valid ObjectId:', id)
      }
    }
    
    console.log('Order found:', order ? 'YES' : 'NO')

    if (!order) {
      await client.close()
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('Generating PDF with jsPDF...')
    
    try {
      // Generate PDF using jsPDF-based function
      const { buffer, fileName } = generateInvoicePDF(order)
      await client.close()
      
      console.log('PDF generated successfully, size:', buffer.length)

      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError)
      await client.close()
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: pdfError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Invoice API error:', error)
    return NextResponse.json(
      { error: 'Invoice generation failed', details: error.message },
      { status: 500 }
    )
  }
}
