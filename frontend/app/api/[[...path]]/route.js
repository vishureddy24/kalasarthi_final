import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// MongoDB connection
let client
let db
let connectionPromise = null

async function connectToMongo() {
  if (db) return db
  
  // Prevent multiple simultaneous connection attempts
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
          socketTimeoutMS: 45000,
        })
        await client.connect()
        db = client.db(process.env.DB_NAME || 'kalasarthi')
        
        // Create indexes for better performance
        await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 })
        await db.collection('notifications').createIndex({ userId: 1, read: 1 })
        await db.collection('users').createIndex({ id: 1 })
        await db.collection('products').createIndex({ artisanId: 1 })
        await db.collection('orders').createIndex({ userId: 1, createdAt: -1 })
        await db.collection('transactions').createIndex({ artisanId: 1, date: -1 })
        
        console.log('MongoDB connected successfully with indexes')
      }
      return db
    } catch (err) {
      console.error('MongoDB connection error:', err.message)
      // Reset for retry
      client = null
      db = null
      connectionPromise = null
      throw err
    }
  })()
  
  return connectionPromise
}

// Firebase Admin initialization (for token verification only)
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

// Gemini AI initialization
let geminiModel
try {
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
} catch (e) {
  console.error('Gemini AI initialization error:', e.message)
}

// Razorpay initialization
let razorpay
try {
  const Razorpay = require('razorpay')
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SY8Jo44VXe0UzH',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'ogHSxqKn1Lhu61S7cKATh7PL',
  })
} catch (e) {
  console.error('Razorpay initialization error:', e.message)
}

// Verify Firebase token
async function verifyToken(request) {
  if (!adminAuth) return null
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.split('Bearer ')[1]
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return decoded
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return null
  }
}

// CORS response helper
function corsResponse(data, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// Main route handler
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Health check
    if ((route === '/' || route === '/health' || route === '/root') && method === 'GET') {
      return corsResponse({ status: 'ok', message: 'KalaSarthi API is running' })
    }

    const database = await connectToMongo().catch(err => {
      console.error('Failed to connect to MongoDB:', err.message)
      return null
    })
    
    if (!database) {
      return corsResponse({ error: 'Database connection failed. Please try again later.' }, 503)
    }

    // --- User Profile ---
    if (route === '/user/profile' && method === 'GET') {
      try {
        const user = await verifyToken(request)
        if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
        
        if (!database) {
          console.error('Database not connected for user/profile')
          return corsResponse({ profile: null, error: 'Database unavailable' }, 503)
        }

        if (!user.uid) {
          console.error('User profile GET error: user.uid is missing', user)
          return corsResponse({ profile: null, error: 'Invalid user token' }, 400)
        }

        const profile = await database.collection('users').findOne({ id: user.uid })
        return corsResponse({ profile: profile || null })
      } catch (err) {
        console.error('User profile GET error:', err.message)
        return corsResponse({ profile: null, error: err.message }, 500)
      }
    }

    if (route === '/user/onboard' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)

      const body = await request.json()
      const profileData = {
        id: user.uid,
        email: user.email || '',
        displayName: body.displayName || user.name || 'User',
        role: body.role,
        isOnboarded: true,
        craftType: body.craftType || '',
        location: body.location || '',
        experience: body.experience || '',
        bio: body.bio || '',
        phone: body.phone || '',
        interests: body.interests || [],
        address: body.address || '',
        city: body.city || '',
        state: body.state || '',
        lat: body.lat || null,
        lng: body.lng || null,
        preferredLanguage: body.preferredLanguage || 'en',
        voiceEnabled: body.voiceEnabled !== undefined ? body.voiceEnabled : true,
        mapVisible: body.mapVisible !== undefined ? body.mapVisible : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await database.collection('users').updateOne(
        { id: user.uid },
        { $set: profileData },
        { upsert: true }
      )
      return corsResponse({ profile: profileData })
    }

    if (route === '/artisans' && method === 'GET') {
      const artisans = await database.collection('users')
        .find({ role: 'artisan', lat: { $ne: null }, lng: { $ne: null } })
        .project({ _id: 0, id: 1, displayName: 1, craftType: 1, lat: 1, lng: 1, location: 1, bio: 1 })
        .toArray()
      return corsResponse({ artisans })
    }

    // --- Products ---
    if (route === '/products' && method === 'GET') {
      try {
        const url = new URL(request.url)
        const artisanId = url.searchParams.get('artisanId')
        const category = url.searchParams.get('category')

        const filter = {}
        if (artisanId) {
          filter.artisanId = artisanId
        } else {
          filter.isActive = { $ne: false }
        }
        if (category) {
          filter.category = category
        }

        console.log('Products filter:', filter)

        const products = await database.collection('products')
          .find(filter)
          .sort({ createdAt: -1 })
          .limit(200)
          .toArray()

        // Remove MongoDB _id
        const cleanProducts = products.map(({ _id, ...rest }) => rest)
        return corsResponse({ products: cleanProducts })
      } catch (err) {
        console.error('Products API error:', err)
        return corsResponse({ error: 'Failed to fetch products', details: err.message }, 500)
      }
    }

    if (route === '/products' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)

      const body = await request.json()
      if (!body.title || !body.price) {
        return corsResponse({ error: 'Title and price are required' }, 400)
      }

      const productId = uuidv4()
      const product = {
        id: productId,
        artisanId: user.uid,
        artisanName: body.artisanName || user.name || 'Artisan',
        title: body.title,
        description: body.description || '',
        price: Number(body.price),
        category: body.category || '',
        craftType: body.craftType || '',
        materials: body.materials || '',
        dimensions: body.dimensions || '',
        imageUrl: body.imageUrl || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await database.collection('products').insertOne(product)
      return corsResponse({ product }, 201)
    }

    // --- Products New Arrivals (Public) ---
    if (path[0] === 'products' && path[1] === 'new-arrivals' && method === 'GET') {
      try {
        // Get products from last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const products = await database.collection('products')
          .find({ 
            isActive: { $ne: false },
            createdAt: { $gte: thirtyDaysAgo.toISOString() }
          })
          .sort({ createdAt: -1 })
          .limit(20)
          .toArray()
        
        // Remove MongoDB _id
        const cleanProducts = products.map(({ _id, ...rest }) => rest)
        return corsResponse({ products: cleanProducts })
      } catch (err) {
        console.error('New arrivals API error:', err)
        return corsResponse({ error: 'Failed to fetch new arrivals', details: err.message }, 500)
      }
    }

    // Product by ID - GET
    if (path[0] === 'products' && path[1] && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const productId = path[1]
      
      try {
        const product = await database.collection('products').findOne({ id: productId })
        if (!product) return corsResponse({ error: 'Product not found' }, 404)
        if (product.artisanId !== user.uid) return corsResponse({ error: 'Forbidden' }, 403)
        
        return corsResponse({ product: { ...product, _id: undefined } })
      } catch (err) {
        console.error('Product fetch error:', err)
        return corsResponse({ error: 'Failed to fetch product', details: err.message }, 500)
      }
    }

    // Product by ID - PUT
    if (path[0] === 'products' && path[1] && method === 'PUT') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)

      const productId = path[1]
      const body = await request.json()

      const existing = await database.collection('products').findOne({ id: productId })
      if (!existing) return corsResponse({ error: 'Product not found' }, 404)
      if (existing.artisanId !== user.uid) return corsResponse({ error: 'Forbidden' }, 403)

      const updates = { ...body, updatedAt: new Date().toISOString() }
      delete updates.id
      delete updates.artisanId
      delete updates.createdAt
      delete updates._id

      await database.collection('products').updateOne(
        { id: productId },
        { $set: updates }
      )
      return corsResponse({ product: { ...existing, ...updates, _id: undefined } })
    }

    // Product by ID - DELETE (soft)
    if (path[0] === 'products' && path[1] && method === 'DELETE') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)

      const productId = path[1]
      const existing = await database.collection('products').findOne({ id: productId })
      if (!existing) return corsResponse({ error: 'Product not found' }, 404)
      if (existing.artisanId !== user.uid) return corsResponse({ error: 'Forbidden' }, 403)

      await database.collection('products').updateOne(
        { id: productId },
        { $set: { isActive: false, updatedAt: new Date().toISOString() } }
      )
      return corsResponse({ success: true, message: 'Product removed' })
    }

    // --- Cart ---
    if (route === '/cart' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      const cart = await database.collection('cart').findOne({ userId: user.uid })
      const safeCart = cart || { userId: user.uid, items: [], totalAmount: 0 }
      delete safeCart._id
      return corsResponse({ cart: safeCart })
    }

    if (route === '/cart/add' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      if (!database) return corsResponse({ error: 'Database unavailable' }, 503)
      
      const body = await request.json()
      // Support both formats: { productId, title, price } and { product: { id, title, price } }
      const productId = body.productId || body.product?.id || body.id
      const title = body.title || body.product?.title || body.name
      const price = body.price || body.product?.price || 0
      const image = body.image || body.product?.image || body.product?.images?.[0]
      const quantity = body.quantity || 1
      
      if (!productId) {
        return corsResponse({ error: 'Invalid product data: productId required' }, 400)
      }
      
      let cart = await database.collection('cart').findOne({ userId: user.uid })
      if (!cart) cart = { userId: user.uid, items: [], totalAmount: 0 }
      
      const existingIdx = cart.items.findIndex(i => i.productId === productId)
      if (existingIdx >= 0) {
        cart.items[existingIdx].quantity += quantity
      } else {
        cart.items.push({ 
          productId, 
          title: title || 'Product', 
          price: Number(price) || 0, 
          image,
          quantity 
        })
      }
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      cart.updatedAt = new Date().toISOString()
      
      await database.collection('cart').updateOne({ userId: user.uid }, { $set: cart }, { upsert: true })
      delete cart._id
      return corsResponse({ cart })
    }

    if (route === '/cart/remove' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      const { productId } = await request.json()
      let cart = await database.collection('cart').findOne({ userId: user.uid })
      if (!cart) return corsResponse({ cart: { userId: user.uid, items: [], totalAmount: 0 } })

      cart.items = cart.items.filter(i => i.productId !== productId)
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      cart.updatedAt = new Date().toISOString()

      await database.collection('cart').updateOne({ userId: user.uid }, { $set: cart })
      delete cart._id
      return corsResponse({ cart })
    }

    if (route === '/cart/update' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      const { productId, quantity } = await request.json()
      let cart = await database.collection('cart').findOne({ userId: user.uid })
      if (!cart) return corsResponse({ cart: { userId: user.uid, items: [], totalAmount: 0 } })

      const itemIndex = cart.items.findIndex(i => i.productId === productId)
      if (itemIndex >= 0) {
        if (quantity <= 0) {
          cart.items.splice(itemIndex, 1)
        } else {
          cart.items[itemIndex].quantity = quantity
        }
      }
      cart.totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      cart.updatedAt = new Date().toISOString()

      await database.collection('cart').updateOne({ userId: user.uid }, { $set: cart })
      delete cart._id
      return corsResponse({ cart })
    }

    // --- Wishlist ---
    if (route === '/wishlist/toggle' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const { productId } = await request.json()
      
      // Check if product exists in wishlist
      const existing = await database.collection('wishlist').findOne({
        userId: user.uid,
        productId: productId
      })
      
      if (existing) {
        // Remove from wishlist
        await database.collection('wishlist').deleteOne({ _id: existing._id })
        return corsResponse({ isWishlisted: false, message: 'Removed from wishlist' })
      } else {
        // Add to wishlist
        await database.collection('wishlist').insertOne({
          id: crypto.randomUUID(),
          userId: user.uid,
          productId: productId,
          createdAt: new Date().toISOString()
        })
        return corsResponse({ isWishlisted: true, message: 'Added to wishlist' })
      }
    }

    if (route === '/wishlist' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const wishlistItems = await database.collection('wishlist')
        .find({ userId: user.uid })
        .sort({ createdAt: -1 })
        .toArray()
      
      // Get full product details
      const productIds = wishlistItems.map(item => item.productId)
      const products = await database.collection('products')
        .find({ id: { $in: productIds } })
        .toArray()
      
      // Merge wishlist data with product details
      const wishlistWithProducts = wishlistItems.map(item => {
        const product = products.find(p => p.id === item.productId)
        return {
          ...item,
          product: product || null
        }
      }).filter(item => item.product !== null)
      
      return corsResponse({ wishlist: wishlistWithProducts.map(({_id, ...rest}) => rest) })
    }

    if (route.startsWith('/wishlist/') && method === 'DELETE') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const productId = route.replace('/wishlist/', '')
      
      await database.collection('wishlist').deleteOne({
        userId: user.uid,
        productId: productId
      })
      
      return corsResponse({ success: true, message: 'Removed from wishlist' })
    }

    // --- Payment / Orders ---
    if (route === '/payment/create-order' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      if (!razorpay) return corsResponse({ error: 'Razorpay not configured' }, 500)
      
      const { amount, items, subtotal, discount, gst, coupon, userEmail, userName } = await request.json()
      
      try {
        // Calculate GST if not provided
        const subtotalAmount = subtotal || amount
        const discountAmount = discount || 0
        const taxableAmount = subtotalAmount - discountAmount
        const gstRate = 0.18
        const gstAmount = gst || Math.round(taxableAmount * gstRate)
        const cgst = Math.round(gstAmount / 2)
        const sgst = Math.round(gstAmount / 2)
        const totalAmount = taxableAmount + gstAmount

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({ 
          amount: Math.round(totalAmount * 100), // Convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`
        })
        
        // Generate Invoice Number
        const invoiceNumber = `INV-KS-${Date.now().toString().slice(-8)}`
        
        // Save pending order to database
        const orderData = {
          id: crypto.randomUUID(),
          userId: user.uid,
          userEmail: userEmail || user.email,
          userName: userName || user.name || 'Customer',
          items: items || [],
          subtotal: subtotalAmount,
          discount: discountAmount,
          gst: gstAmount,
          cgst,
          sgst,
          taxableAmount,
          coupon: coupon || null,
          total: totalAmount,
          invoiceNumber,
          invoiceDate: new Date().toISOString(),
          hsnCode: '9997', // Handicrafts HSN code
          razorpayOrderId: razorpayOrder.id,
          status: 'pending',
          timeline: [{ status: 'created', time: new Date().toISOString() }],
          emailSent: false,
          createdAt: new Date().toISOString()
        }
        
        await database.collection('orders').insertOne(orderData)
        
        return corsResponse({ 
          orderId: razorpayOrder.id,
          key: process.env.RAZORPAY_KEY_ID || 'rzp_test_SY8Jo44VXe0UzH',
          orderDBId: orderData.id
        })
      } catch (err) {
        console.error('Create order error:', err)
        return corsResponse({ error: err.message }, 500)
      }
    }

    if (route === '/payment/verify' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
      
      // Verify signature
      const body = razorpay_order_id + "|" + razorpay_payment_id
      const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'ogHSxqKn1Lhu61S7cKATh7PL')
                             .update(body).digest("hex")
      
      if (expected !== razorpay_signature) {
        return corsResponse({ success: false, error: 'Invalid Signature' }, 400)
      }
      
      // Find and update order (webhook will handle the rest)
      const order = await database.collection('orders').findOne({ razorpayOrderId: razorpay_order_id })
      
      if (!order) {
        return corsResponse({ error: 'Order not found' }, 404)
      }
      
      // Update order with payment details and status
      const now = new Date().toISOString()
      await database.collection('orders').updateOne(
        { razorpayOrderId: razorpay_order_id },
        {
          $set: {
            status: 'paid',
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paidAt: now,
            updatedAt: now
          },
          $push: {
            timeline: { status: 'paid', time: now, paymentId: razorpay_payment_id }
          }
        }
      )
      
      return corsResponse({ success: true, message: 'Payment verified. Order has been paid.' })
    }

    if (route === '/orders' && method === 'GET') {
      try {
        const user = await verifyToken(request)
        if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
        
        if (!database) {
          return corsResponse({ error: 'Database not connected' }, 503)
        }
        
        const orders = await database.collection('orders')
          .find({ userId: user.uid })
          .sort({ createdAt: -1 })
          .toArray()
          
        return corsResponse({ orders: orders.map(({_id, ...rest}) => rest) })
      } catch (err) {
        console.error('Orders GET error:', err)
        return corsResponse({ error: 'Failed to fetch orders', details: err.message }, 500)
      }
    }

    // --- Admin ---
    if (route === '/admin/stats' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      if (user.email !== 'vishureddy2401@gmail.com') return corsResponse({ error: 'Access Denied' }, 403)
      
      const [usersCount, orders] = await Promise.all([
        database.collection('users').countDocuments(),
        database.collection('orders').find().toArray()
      ])
      
      const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      
      return corsResponse({
        users: usersCount,
        orders: orders.length,
        revenue
      })
    }

    // --- AI Generate Description ---
    if (route === '/ai/generate-description' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        
        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY) {
          console.log('OpenAI API key not set, using fallback description')
          return corsResponse({ 
            description: `This exquisite handcrafted ${body.title || 'item'} showcases the timeless artistry of traditional Indian craftsmanship. Each piece is lovingly created by skilled artisans using ${body.materials || 'natural materials'}, reflecting centuries of cultural heritage and meticulous attention to detail. The ${body.craftType || 'traditional'} techniques employed ensure every item is unique, carrying the soul and story of its maker. Perfect for those who appreciate authentic, handmade artistry that connects them to India's rich artisanal traditions.`,
            fallback: true 
          })
        }
        
        const { openai, DEFAULT_MODEL, TEMPERATURE } = require('@/lib/ai/openai')
        
        const response = await openai.chat.completions.create({
          model: DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a creative copywriter for KalaSarthi, an Indian artisan marketplace.'
            },
            {
              role: 'user',
              content: `Generate a compelling, culturally rich product description for this handcrafted item:

Product Name: ${body.title || 'Handcrafted Item'}
Category: ${body.category || 'General'}
Craft Type: ${body.craftType || 'Traditional'}
Materials: ${body.materials || 'Natural materials'}

Write a warm, authentic description (150-200 words) that:
- Highlights the artisan's skill and traditional craftsmanship
- Mentions cultural significance and heritage
- Appeals to buyers who appreciate handmade Indian art
- Uses evocative, sensory language
- Includes care instructions if relevant

Write ONLY the description, no headers or labels.`
            }
          ],
          temperature: TEMPERATURE.CREATIVE
        })
        
        const description = response.choices[0].message.content
        return corsResponse({ description })
      } catch (err) {
        console.error('AI description error:', err.message)
        // Return fallback description instead of 500
        const body = await request.json().catch(() => ({}))
        return corsResponse({ 
          description: `This exquisite handcrafted ${body.title || 'item'} showcases the timeless artistry of traditional Indian craftsmanship. Each piece is lovingly created by skilled artisans using ${body.materials || 'natural materials'}, reflecting centuries of cultural heritage and meticulous attention to detail. The ${body.craftType || 'traditional'} techniques employed ensure every item is unique, carrying the soul and story of its maker. Perfect for those who appreciate authentic, handmade artistry that connects them to India's rich artisanal traditions.`,
          fallback: true,
          error: err.message
        })
      }
    }

    // --- AI Scheme Recommendations ---
    if (route === '/schemes/recommend' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const artisanId = url.searchParams.get('artisanId') || user.uid
      
      // Fetch user profile
      const profile = await database.collection('users').findOne({ id: artisanId })
      
      // Fetch all active schemes
      const schemes = await database.collection('schemes')
        .find({ isActive: true })
        .toArray()
      
      if (schemes.length === 0) {
        return corsResponse({ recommendations: [], message: 'No schemes available' })
      }
      
      try {
        // Use the scheme recommender
        const { recommendSchemes } = require('@/lib/ai/schemeRecommender')
        const recommendations = await recommendSchemes(profile, schemes)
        
        return corsResponse({ 
          recommendations,
          generatedAt: new Date().toISOString(),
          totalSchemes: schemes.length,
          aiPowered: true
        })
      } catch (err) {
        console.error('AI recommendation error:', err)
        // Fallback to basic filtering
        const fallback = schemes
          .filter(s => s.eligibility?.includes(profile?.role) || s.eligibility?.includes('all'))
          .slice(0, 3)
          .map((s, i) => ({
            schemeId: s.id,
            name: s.name,
            reason: `Recommended based on your ${profile?.role || 'artisan'} profile.`,
            matchScore: 80 - (i * 5),
            keyBenefit: s.benefits || 'Government support',
            scheme: s
          }))
        
        return corsResponse({ 
          recommendations: fallback,
          generatedAt: new Date().toISOString(),
          totalSchemes: schemes.length,
          aiPowered: false,
          fallback: true
        })
      }
    }

    // --- AI Auto-Fill Scheme Form ---
    if (route === '/schemes/autofill' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const { artisanId, schemeId } = body
      
      // Fetch user profile
      const profile = await database.collection('users').findOne({ id: artisanId || user.uid })
      
      // Fetch scheme details
      const scheme = await database.collection('schemes').findOne({ id: schemeId })
      
      if (!scheme) {
        return corsResponse({ error: 'Scheme not found' }, 404)
      }
      
      try {
        // Use the auto-fill utility
        const { autoFillSchemeForm } = require('@/lib/ai/autoFillScheme')
        const formData = await autoFillSchemeForm(profile, scheme)
        
        return corsResponse({ 
          formData,
          schemeName: scheme.name,
          generatedAt: new Date().toISOString(),
          aiPowered: true
        })
      } catch (err) {
        console.error('AI auto-fill error:', err)
        // Return fallback data
        return corsResponse({ 
          formData: {
            businessName: `${profile?.displayName || 'My'} Handicrafts`,
            yearsInBusiness: profile?.yearsInBusiness || '2-3 years',
            annualTurnover: profile?.annualTurnover || '₹2-4 Lakhs',
            employees: profile?.employees || '1-3 workers',
            description: `Traditional handicraft business specializing in handmade products.`,
            reasonForApplying: `To expand business operations and reach more customers.`,
            howSchemeHelps: `Will provide necessary financial support and resources.`
          },
          schemeName: scheme.name,
          aiPowered: false,
          fallback: true
        })
      }
    }

    // --- Artisan Stats ---
    if (route === '/artisan/stats' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const artisanId = url.searchParams.get('artisanId') || user.uid
      
      // Get artisan's products
      const products = await database.collection('products')
        .find({ artisanId })
        .toArray()
      
      // Get orders containing artisan's products
      const orders = await database.collection('orders').find().toArray()
      
      let totalRevenue = 0
      let totalOrders = 0
      let productsSold = 0
      const dailyRevenue = {}
      
      orders.forEach(order => {
        let orderHasArtisanProduct = false
        order.items?.forEach(item => {
          if (item.productId && products.some(p => p.id === item.productId)) {
            totalRevenue += (item.price * item.quantity)
            productsSold += item.quantity
            orderHasArtisanProduct = true
            
            // Track daily revenue
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
              month: 'short',
              day: 'numeric'
            })
            dailyRevenue[date] = (dailyRevenue[date] || 0) + (item.price * item.quantity)
          }
        })
        if (orderHasArtisanProduct) totalOrders++
      })
      
      // Calculate top products
      const productSales = {}
      orders.forEach(order => {
        order.items?.forEach(item => {
          if (item.productId && products.some(p => p.id === item.productId)) {
            if (!productSales[item.productId]) {
              productSales[item.productId] = {
                id: item.productId,
                title: item.title,
                quantitySold: 0,
                revenue: 0
              }
            }
            productSales[item.productId].quantitySold += item.quantity
            productSales[item.productId].revenue += (item.price * item.quantity)
          }
        })
      })
      
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5)
      
      // Convert dailyRevenue to array for chart
      const chartData = Object.entries(dailyRevenue)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7) // Last 7 days
      
      return corsResponse({
        totalProducts: products.length,
        activeProducts: products.filter(p => p.isActive !== false).length,
        totalRevenue,
        totalOrders,
        productsSold,
        chartData,
        topProducts
      })
    }

    // --- Transactions (Digital Khata) ---
    if (route === '/transactions' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const artisanId = url.searchParams.get('artisanId') || user.uid
      
      const transactions = await database.collection('transactions')
        .find({ artisanId })
        .sort({ date: -1 })
        .toArray()
      
      return corsResponse({ transactions: transactions.map(({_id, ...rest}) => rest) })
    }

    if (route === '/transactions' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const transaction = {
        ...body,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await database.collection('transactions').insertOne(transaction)
      return corsResponse({ transaction }, 201)
    }

    // --- Transactions Chart (Monthly Income/Expense) ---
    if (route === '/transactions/chart' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const artisanId = url.searchParams.get('artisanId') || user.uid
      
      const transactions = await database.collection('transactions')
        .find({ artisanId })
        .toArray()
      
      const monthly = {}
      
      transactions.forEach(t => {
        const key = new Date(t.date || t.createdAt).toLocaleDateString('en-IN', {
          month: 'short',
          year: 'numeric'
        })
        
        if (!monthly[key]) {
          monthly[key] = { income: 0, expense: 0 }
        }
        
        if (t.type === 'income') {
          monthly[key].income += t.amount
        } else {
          monthly[key].expense += t.amount
        }
      })
      
      const chartData = Object.keys(monthly).map(month => ({
        month,
        income: monthly[month].income,
        expense: monthly[month].expense
      })).sort((a, b) => new Date(a.month) - new Date(b.month))
      
      return corsResponse({ chartData })
    }

    // --- Scheme Applications ---
    if (route === '/schemes/apply' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const application = {
        ...body,
        id: crypto.randomUUID(),
        status: 'submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await database.collection('schemeApplications').insertOne(application)
      
      // Create notification for artisan
      await database.collection('notifications').insertOne({
        id: crypto.randomUUID(),
        userId: body.artisanId,
        message: `Scheme application submitted: ${body.schemeName}`,
        type: 'scheme',
        read: false,
        createdAt: new Date().toISOString()
      })
      
      return corsResponse({ application }, 201)
    }

    if (route === '/schemes/my' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const artisanId = url.searchParams.get('artisanId') || user.uid
      
      const applications = await database.collection('schemeApplications')
        .find({ artisanId })
        .sort({ createdAt: -1 })
        .toArray()
      
      return corsResponse({ applications: applications.map(({_id, ...rest}) => rest) })
    }

    // --- Document Upload (Firebase Storage) ---
    if (route === '/upload/document' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const formData = await request.formData()
      const file = formData.get('file')
      const applicationId = formData.get('applicationId')
      
      if (!file) return corsResponse({ error: 'No file provided' }, 400)
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        return corsResponse({ error: 'Invalid file type. Only JPG, PNG, PDF allowed' }, 400)
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        return corsResponse({ error: 'File too large. Max 5MB' }, 400)
      }
      
      try {
        // Convert file to buffer and upload to Firebase
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Use Firebase Admin SDK for server-side upload
        const { getStorage } = require('firebase-admin/storage')
        const bucket = getStorage().bucket()
        const filename = `documents/${user.uid}/${Date.now()}_${file.name}`
        
        const fileUpload = bucket.file(filename)
        await fileUpload.save(buffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              originalName: file.name,
              uploadedBy: user.uid,
              applicationId: applicationId || null
            }
          }
        })
        
        // Make file publicly accessible
        await fileUpload.makePublic()
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`
        
        // Store reference in database
        const docRecord = {
          id: crypto.randomUUID(),
          userId: user.uid,
          applicationId: applicationId || null,
          filename: file.name,
          url: publicUrl,
          type: file.type,
          size: file.size,
          path: filename,
          createdAt: new Date().toISOString()
        }
        
        await database.collection('documents').insertOne(docRecord)
        
        return corsResponse({ 
          success: true, 
          url: publicUrl,
          document: docRecord 
        })
      } catch (err) {
        console.error('Upload error:', err)
        return corsResponse({ error: 'Failed to upload file' }, 500)
      }
    }

    // --- Notifications ---
    if (route === '/notifications' && method === 'GET') {
      try {
        const user = await verifyToken(request)
        if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
        
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId') || user.uid
        const limit = parseInt(url.searchParams.get('limit')) || 20
        
        console.log('Fetching notifications for user:', userId)
        
        const notifications = await database.collection('notifications')
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray()
        
        return corsResponse({ notifications: notifications.map(({_id, ...rest}) => rest) })
      } catch (err) {
        console.error('Notifications GET error:', err)
        return corsResponse({ error: 'Failed to fetch notifications', details: err.message }, 500)
      }
    }

    if (route === '/notifications' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const notification = {
        ...body,
        id: crypto.randomUUID(),
        read: false,
        createdAt: new Date().toISOString()
      }
      
      await database.collection('notifications').insertOne(notification)
      return corsResponse({ notification }, 201)
    }

    if (route === '/notifications/read' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const { notificationId } = body
      
      await database.collection('notifications').updateOne(
        { id: notificationId, userId: user.uid },
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      )
      
      return corsResponse({ success: true })
    }

    if (route === '/notifications/read-all' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      await database.collection('notifications').updateMany(
        { userId: user.uid, read: false },
        { $set: { read: true, updatedAt: new Date().toISOString() } }
      )
      
      return corsResponse({ success: true })
    }

    // --- Schemes (Database-driven) ---
    if (route === '/schemes' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const role = url.searchParams.get('role') || 'artisan'
      const state = url.searchParams.get('state')
      const category = url.searchParams.get('category')
      
      // Build query
      const query = { isActive: true }
      
      // Filter by eligibility (role)
      if (role) {
        query.$or = [
          { eligibility: { $in: [role, 'all'] } },
          { eligibility: { $exists: false } }
        ]
      }
      
      // Filter by state if provided
      if (state) {
        query.$and = query.$and || []
        query.$and.push({
          $or: [
            { state: state },
            { state: { $exists: false } },
            { state: null },
            { state: '' }
          ]
        })
      }
      
      // Filter by category
      if (category) {
        query.category = category
      }
      
      const schemes = await database.collection('schemes')
        .find(query)
        .sort({ createdAt: -1 })
        .toArray()
      
      return corsResponse({ schemes: schemes.map(({_id, ...rest}) => rest) })
    }

    // --- Admin: Create Scheme ---
    if (route === '/admin/schemes' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      // Check if admin (you can customize this check)
      if (user.email !== 'vishureddy2401@gmail.com') {
        return corsResponse({ error: 'Admin access required' }, 403)
      }
      
      const body = await request.json()
      
      const scheme = {
        ...body,
        id: crypto.randomUUID(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await database.collection('schemes').insertOne(scheme)
      return corsResponse({ scheme }, 201)
    }

    // --- Admin: Update Scheme ---
    if (route === '/admin/schemes' && method === 'PUT') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      if (user.email !== 'vishureddy2401@gmail.com') {
        return corsResponse({ error: 'Admin access required' }, 403)
      }
      
      const body = await request.json()
      const { id, ...updates } = body
      
      await database.collection('schemes').updateOne(
        { id },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date().toISOString() 
          } 
        }
      )
      
      return corsResponse({ success: true })
    }

    // --- Admin: Delete Scheme ---
    if (route === '/admin/schemes' && method === 'DELETE') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      if (user.email !== 'vishureddy2401@gmail.com') {
        return corsResponse({ error: 'Admin access required' }, 403)
      }
      
      const url = new URL(request.url)
      const id = url.searchParams.get('id')
      
      await database.collection('schemes').deleteOne({ id })
      return corsResponse({ success: true })
    }

    // --- Admin: Sync All Government Schemes ---
    if (route === '/admin/schemes/sync' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      if (user.email !== 'vishureddy2401@gmail.com') {
        return corsResponse({ error: 'Admin access required' }, 403)
      }
      
      try {
        const { aggregateAllSchemes } = require('@/lib/schemeAggregator')
        
        // Aggregate schemes from all sources
        const schemes = await aggregateAllSchemes()
        console.log(`Aggregated ${schemes.length} schemes from all sources`)
        
        // Clear existing government schemes
        await database.collection('schemes').deleteMany({ 
          ministry: { 
            $in: [
              'Ministry of Culture',
              'Development Commissioner Handicrafts',
              'Ministry of Textiles',
              'Ministry of Labour',
              'Government of India'
            ]
          }
        })
        
        // Insert new schemes
        if (schemes.length > 0) {
          await database.collection('schemes').insertMany(schemes)
        }
        
        return corsResponse({ 
          success: true, 
          message: `Synced ${schemes.length} schemes from all government sources`,
          count: schemes.length,
          categories: [...new Set(schemes.map(s => s.category))],
          schemes: schemes.map(({_id, ...rest}) => rest)
        })
        
      } catch (err) {
        console.error('Scheme sync error:', err)
        return corsResponse({ error: 'Failed to sync schemes', details: err.message }, 500)
      }
    }

    // --- Admin: Seed Initial Schemes ---
    if (route === '/admin/schemes/seed' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      // Allow any authenticated user to seed for development
      // In production, restrict to admin only
      const isAdmin = user.email === 'vishureddy2401@gmail.com' || user.role === 'admin'
      
      const initialSchemes = [
        {
          id: crypto.randomUUID(),
          name: 'PM Employment Generation Programme (PMEGP)',
          ministry: 'Ministry of MSME',
          category: 'employment',
          description: 'Financial assistance for setting up new projects. Subsidy up to 35% for general category.',
          eligibility: ['artisan', 'unemployed', 'youth'],
          documents: ['Aadhaar', 'Project Report', 'Caste Certificate', 'Bank Account'],
          benefits: '₹25-50 Lakhs',
          link: 'https://www.kviconline.gov.in/pmegponline/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Scheme of Fund for Regeneration of Traditional Industries (SFURTI)',
          ministry: 'Ministry of MSME',
          category: 'cluster',
          description: 'Support for traditional industries and artisan clusters to enhance productivity.',
          eligibility: ['artisan', 'cluster'],
          documents: ['Cluster Details', 'Artisan List', 'Project Proposal', 'NGO/SPV Registration'],
          benefits: '₹5 Crores',
          link: 'https://sfurti.msme.gov.in/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Ambedkar Hastshilp Vikas Yojana (AHIDU)',
          ministry: 'Development Commissioner (Handicrafts)',
          category: 'skill',
          description: 'Skill development, design & technology upgradation for handicraft artisans.',
          eligibility: ['artisan', 'sc', 'st'],
          documents: ['Artisan ID', 'Caste Certificate', 'Work Sample Photos', 'Bank Details'],
          benefits: 'Training + Tool Kit',
          link: 'https://handicrafts.nic.in/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Design & Technology Upgradation Scheme',
          ministry: 'Development Commissioner (Handicrafts)',
          category: 'design',
          description: 'Financial assistance for design development and technology upgradation.',
          eligibility: ['artisan', 'exporter'],
          documents: ['Company Registration', 'Export Details', 'Design Proposal', 'Financial Statements'],
          benefits: '75% of project cost',
          link: 'https://handicrafts.nic.in/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'Marketing Support & Services Scheme',
          ministry: 'Development Commissioner (Handicrafts)',
          category: 'marketing',
          description: 'Support for domestic and international marketing participation.',
          eligibility: ['artisan', 'exporter'],
          documents: ['IEC Code', 'Registration Certificate', 'Previous Export Records', 'Event Details'],
          benefits: 'Space rent + Freight subsidy',
          link: 'https://handicrafts.nic.in/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: crypto.randomUUID(),
          name: 'One District One Product (ODOP)',
          ministry: 'Ministry of Commerce',
          category: 'branding',
          description: 'Promoting traditional crafts of specific districts through GI tagging and branding.',
          eligibility: ['artisan'],
          documents: ['GI Application', 'Artisan Certificate', 'Product Details', 'District Administration Letter'],
          benefits: 'Full GI registration support',
          link: 'https://odop.gov.in/',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
      
      // Check if schemes already exist
      const existingCount = await database.collection('schemes').countDocuments()
      if (existingCount > 0) {
        return corsResponse({ 
          message: `Database already has ${existingCount} schemes. Skipping seed.`,
          skipped: true 
        })
      }
      
      await database.collection('schemes').insertMany(initialSchemes)
      
      return corsResponse({ 
        success: true, 
        message: `Seeded ${initialSchemes.length} schemes successfully`,
        schemes: initialSchemes 
      }, 201)
    }

    // --- Image Upload to Cloudinary ---
    if (route === '/upload/image' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const formData = await request.formData()
        const file = formData.get('file')
        const folder = formData.get('folder') || 'kalasarthi/products'
        
        if (!file) {
          return corsResponse({ error: 'No file uploaded' }, 400)
        }
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return corsResponse({ error: 'Invalid file type. Use JPG, PNG, or WebP.' }, 400)
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return corsResponse({ error: 'File too large. Max 5MB.' }, 400)
        }
        
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Upload to Cloudinary
        const { uploadImage } = require('@/lib/cloudinary')
        const result = await uploadImage(buffer, folder)
        
        return corsResponse({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        })
        
      } catch (err) {
        console.error('Image upload error:', err)
        return corsResponse({ error: 'Failed to upload image', details: err.message }, 500)
      }
    }

    // --- AI Scheme Recommender ---
    if (route === '/ai/scheme-recommendations' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { recommendSchemes } = require('@/lib/ai/schemeRecommender')
        
        const recommendations = await recommendSchemes(body.profile, body.schemes)
        
        return corsResponse({ 
          success: true,
          recommendations,
          count: recommendations.length
        })
      } catch (err) {
        console.error('AI scheme recommender error:', err)
        return corsResponse({ error: 'Failed to get recommendations', details: err.message }, 500)
      }
    }

    // --- Check Eligibility ---
    if (route === '/schemes/check-eligibility' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { checkEligibility } = require('@/lib/eligibilityChecker')
        
        const result = checkEligibility(body.scheme, body.userProfile)
        
        return corsResponse({ 
          success: true,
          result
        })
      } catch (err) {
        console.error('Eligibility check error:', err)
        return corsResponse({ error: 'Failed to check eligibility', details: err.message }, 500)
      }
    }

    // --- data.gov.in Stats ---
    if (route === '/stats/government' && method === 'GET') {
      try {
        const apiKey = process.env.DATA_GOV_API_KEY
        
        // Fetch data from data.gov.in
        const response = await fetch(
          `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=10`,
          { headers: { 'Accept': 'application/json' } }
        )
        
        if (!response.ok) {
          throw new Error(`data.gov.in API returned ${response.status}`)
        }
        
        const data = await response.json()
        
        // Debug: log the actual structure
        console.log('data.gov.in response structure:', JSON.stringify(data.records?.[0], null, 2))
        
        // Map fields properly - data.gov.in uses various field names
        const mappedStats = data.records?.map((record, index) => {
          // Try different possible field names
          const state = record.state_ut || record.state || record.statename || record.state_name || record.region || 'Unknown'
          const artisans = record.number_of_artists || record.number_of_artisans || record.artisan_count || record.count || record.value || record.artists || 'N/A'
          const sector = record.sector || record.handicrafts || record.craft || record.industry || 'Artisans'
          
          return {
            id: index,
            state: state,
            state_ut: state,
            artisans: artisans,
            number_of_artisans: artisans,
            sector: sector,
            handicrafts: sector,
            raw: record // Keep raw for debugging
          }
        }) || []
        
        return corsResponse({
          success: true,
          stats: mappedStats.slice(0, 6),
          total: data.total || mappedStats.length,
          source: 'data.gov.in'
        })
      } catch (err) {
        console.error('data.gov.in API error:', err)
        // Return fallback stats with proper structure
        return corsResponse({
          success: true,
          stats: [
            { state: 'Uttar Pradesh', state_ut: 'Uttar Pradesh', artisans: '2.5M', number_of_artisans: '2.5M', sector: 'Carpets, Pottery', handicrafts: 'Carpets, Pottery' },
            { state: 'Rajasthan', state_ut: 'Rajasthan', artisans: '1.8M', number_of_artisans: '1.8M', sector: 'Textiles, Jewelry', handicrafts: 'Textiles, Jewelry' },
            { state: 'West Bengal', state_ut: 'West Bengal', artisans: '1.2M', number_of_artisans: '1.2M', sector: 'Kantha, Sholapith', handicrafts: 'Kantha, Sholapith' },
            { state: 'Gujarat', state_ut: 'Gujarat', artisans: '1.1M', number_of_artisans: '1.1M', sector: 'Bandhani, Patola', handicrafts: 'Bandhani, Patola' },
            { state: 'Tamil Nadu', state_ut: 'Tamil Nadu', artisans: '900K', number_of_artisans: '900K', sector: 'Bronze, Tanjore', handicrafts: 'Bronze, Tanjore' },
            { state: 'Odisha', state_ut: 'Odisha', artisans: '750K', number_of_artisans: '750K', sector: 'Pattachitra, Silver', handicrafts: 'Pattachitra, Silver' }
          ],
          source: 'fallback',
          note: 'Using sample data - data.gov.in API unavailable'
        })
      }
    }

    // --- OCR + AI Document Parsing ---
    if (route === '/ocr/parse' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const formData = await request.formData()
        const file = formData.get('file')
        const documentType = formData.get('documentType') || 'aadhaar'
        
        if (!file) {
          return corsResponse({ error: 'No file uploaded' }, 400)
        }
        
        // Validate file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
          return corsResponse({ error: 'Invalid file type. Use JPG or PNG.' }, 400)
        }
        
        if (file.size > 10 * 1024 * 1024) {
          return corsResponse({ error: 'File too large. Max 10MB.' }, 400)
        }
        
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // Step 1: OCR Extraction
        const { extractTextFromImage, cleanOCRText } = require('@/lib/ocr')
        const ocrResult = await extractTextFromImage(buffer)
        const cleanedText = cleanOCRText(ocrResult.text)
        
        // Step 2: AI Parsing (if Gemini available)
        let structuredData = {}
        let aiParsed = false
        
        if (geminiModel) {
          try {
            const { parseDocumentWithAI } = require('@/lib/ai/documentParser')
            structuredData = await parseDocumentWithAI(cleanedText, documentType)
            aiParsed = true
          } catch (aiError) {
            console.error('AI parsing error:', aiError)
            // Fallback to basic extraction
            const { mapDocumentToFormFields } = require('@/lib/ai/documentParser')
            structuredData = mapDocumentToFormFields({
              fullName: cleanedText.match(/name[:\s]+([A-Za-z\s]+)/i)?.[1] || '',
              address: cleanedText.match(/address[:\s]+([\s\S]{20,200}?)(?=\n\n|$)/i)?.[1] || ''
            })
          }
        } else {
          // No AI available - basic extraction
          structuredData = {
            fullName: cleanedText.match(/name[:\s]+([A-Za-z\s]+)/i)?.[1]?.trim() || '',
            address: cleanedText.match(/address[:\s]+([\s\S]{20,200}?)(?=\n\n|$)/i)?.[1]?.trim() || '',
            confidence: 'low',
            aiPowered: false
          }
        }
        
        return corsResponse({
          success: true,
          extractedData: structuredData,
          ocrConfidence: ocrResult.confidence,
          aiParsed,
          documentType,
          rawTextPreview: cleanedText.substring(0, 200) + '...'
        })
        
      } catch (err) {
        console.error('OCR API error:', err)
        return corsResponse({ error: 'Failed to process document' }, 500)
      }
    }

    // --- AI Chat Assistant ---
    if (route === '/ai/chat' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { messages, profile } = body
        
        // Check OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
          console.error('OPENAI_API_KEY not set')
          // Return a fallback response instead of error
          return corsResponse({
            reply: "Hello! I'm currently in offline mode. Please set up your OpenAI API key to use the AI assistant features.",
            context: { offline: true }
          })
        }
        
        // Get user stats for context
        const userStats = await database.collection('users').findOne({ id: user.uid })
        const orders = await database.collection('orders')
          .find({ artisanId: user.uid })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray()
        
        const orderSummary = orders.map(o => ({
          status: o.status,
          total: o.total,
          date: o.createdAt?.split('T')[0]
        }))
        
        // Get khata summary
        const transactions = await database.collection('transactions')
          .find({ userId: user.uid })
          .sort({ date: -1 })
          .limit(10)
          .toArray()
        
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        const totalExpense = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
        
        // Get available schemes
        const availableSchemes = await database.collection('schemes')
          .find({ isActive: true })
          .limit(5)
          .toArray()
          .then(s => s.map(({ name, benefits, description }) => ({ name, benefits, description })))
        
        const systemPrompt = `You are KalaSarthi AI Assistant, a helpful companion for Indian artisans.

USER PROFILE:
- Name: ${profile?.displayName || user.displayName || 'Artisan'}
- Role: ${profile?.role || userStats?.role || 'artisan'}
- Location: ${profile?.location || userStats?.location || 'India'}
- Craft/Category: ${profile?.category || userStats?.category || 'Handicrafts'}

RECENT ORDERS (${orders.length}):
${JSON.stringify(orderSummary, null, 2)}

KHATA SUMMARY:
- Total Income: ₹${totalIncome}
- Total Expense: ₹${totalExpense}
- Balance: ₹${totalIncome - totalExpense}

AVAILABLE SCHEMES:
${JSON.stringify(availableSchemes, null, 2)}

YOUR ROLE:
1. Answer questions about government schemes
2. Help understand orders and revenue
3. Give business advice for artisans
4. Explain financial terms in simple language
5. Suggest relevant schemes based on user's profile

RULES:
- Keep responses concise (2-3 paragraphs max)
- Be warm, encouraging, and culturally respectful
- Use simple English, avoid technical jargon
- If suggesting schemes, explain WHY they fit the user
- For khata questions, reference the actual numbers above
- For order questions, check the recent orders data
- Always be helpful and actionable

Respond naturally as a helpful assistant.`

        try {
          const { openai, DEFAULT_MODEL, TEMPERATURE } = require('@/lib/ai/openai')
          
          const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages
            ],
            temperature: TEMPERATURE.BALANCED
          })
          
          const reply = response.choices[0].message.content
          
          return corsResponse({
            reply,
            context: {
              ordersCount: orders.length,
              balance: totalIncome - totalExpense,
              schemesAvailable: availableSchemes.length
            }
          })
        } catch (aiError) {
          console.error('OpenAI API error:', aiError.message)
          // Return fallback response on AI failure
          return corsResponse({
            reply: "I'm having trouble connecting to the AI service right now. Please try again in a moment, or contact support if the issue persists.",
            context: { error: aiError.message },
            fallback: true
          })
        }
        
      } catch (err) {
        console.error('Chat API error:', err)
        return corsResponse({ 
          error: 'Failed to process chat message',
          details: err.message 
        }, 500)
      }
    }

    // --- User Addresses ---
    if (route === '/user/addresses' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId') || user.uid
      
      const addresses = await database.collection('addresses')
        .find({ userId })
        .sort({ isDefault: -1, createdAt: -1 })
        .toArray()
      
      return corsResponse({ addresses: addresses.map(({_id, ...rest}) => rest) })
    }

    if (route === '/user/addresses' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      const address = {
        ...body,
        id: crypto.randomUUID(),
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await database.collection('addresses').insertOne(address)
      return corsResponse({ address }, 201)
    }

    // --- User Profile Update ---
    if (route === '/user/profile' && method === 'PUT') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      const body = await request.json()
      
      const updates = {
        ...body,
        updatedAt: new Date().toISOString()
      }
      delete updates.id
      delete updates.email
      delete updates.createdAt
      
      await database.collection('users').updateOne(
        { id: user.uid },
        { $set: updates }
      )
      
      return corsResponse({ success: true, message: 'Profile updated' })
    }

    // --- Scheme Applications ---
    if (route === '/schemes/apply' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { schemeId, schemeTitle, documents, formData } = body
        
        const application = {
          id: crypto.randomUUID(),
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'User',
          schemeId,
          schemeTitle,
          status: 'pending',
          documents: documents || [],
          formData: formData || {},
          appliedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await database.collection('schemeApplications').insertOne(application)
        
        // Create notification
        await database.collection('notifications').insertOne({
          id: crypto.randomUUID(),
          userId: user.uid,
          title: 'Scheme Application Submitted',
          message: `Your application for ${schemeTitle} has been received and is under review.`,
          type: 'scheme',
          read: false,
          createdAt: new Date().toISOString()
        })
        
        return corsResponse({ 
          success: true, 
          application,
          message: 'Application submitted successfully'
        }, 201)
        
      } catch (err) {
        console.error('Scheme apply error:', err)
        return corsResponse({ error: 'Failed to submit application' }, 500)
      }
    }

    // --- Get My Applications ---
    if (route === '/schemes/my-applications' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const applications = await database.collection('schemeApplications')
          .find({ userId: user.uid })
          .sort({ appliedAt: -1 })
          .toArray()
        
        return corsResponse({ 
          applications: applications.map(({_id, ...rest}) => rest),
          count: applications.length 
        })
        
      } catch (err) {
        console.error('Fetch applications error:', err)
        return corsResponse({ error: 'Failed to fetch applications' }, 500)
      }
    }

    // --- Get All Artisans ---
    if (route === '/artisans' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const artisans = await database.collection('users')
          .find({ role: 'artisan' })
          .project({ password: 0, _id: 0 })
          .sort({ displayName: 1 })
          .toArray()
        
        return corsResponse({ 
          artisans: artisans.map(a => ({
            ...a,
            id: a.id || a._id?.toString()
          }))
        })
      } catch (err) {
        console.error('Fetch artisans error:', err)
        return corsResponse({ error: 'Failed to fetch artisans' }, 500)
      }
    }

    // --- Get Artisan by ID ---
    if (route.startsWith('/artisans/') && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const artisanId = route.split('/')[2]
        const artisan = await database.collection('users').findOne(
          { id: artisanId, role: 'artisan' },
          { projection: { password: 0, _id: 0 } }
        )
        
        if (!artisan) {
          return corsResponse({ error: 'Artisan not found' }, 404)
        }
        
        return corsResponse({ 
          artisan: {
            ...artisan,
            id: artisan.id || artisan._id?.toString()
          }
        })
      } catch (err) {
        console.error('Fetch artisan error:', err)
        return corsResponse({ error: 'Failed to fetch artisan' }, 500)
      }
    }

    // --- Custom Requests ---
    // Create custom request
    if (route === '/custom-requests' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { artisanId, message, budget, deadline, sampleImages, buyerPhone } = body
        
        const now = new Date().toISOString()
        const customRequest = {
          id: crypto.randomUUID(),
          buyerId: user.uid,
          buyerEmail: user.email,
          buyerName: user.displayName || 'Buyer',
          buyerPhone,
          artisanId,
          message,
          budget: budget || null,
          deadline: deadline || null,
          sampleImages: sampleImages || [],
          status: 'pending',
          statusHistory: [
            { status: 'pending', date: now, note: 'Request created' }
          ],
          createdAt: now,
          updatedAt: now
        }
        
        await database.collection('customRequests').insertOne(customRequest)
        
        // Send email notification to artisan
        try {
          // Fetch artisan profile to get email
          const artisanProfile = await database.collection('users').findOne({ uid: artisanId })
          if (artisanProfile?.email) {
            const { sendCustomRequestEmailToArtisan } = await import('@/lib/sendEmail')
            await sendCustomRequestEmailToArtisan(customRequest, artisanProfile.email, artisanProfile.displayName || 'Artisan')
          }
        } catch (emailErr) {
          console.log('Email sending failed (artisan may not have email):', emailErr.message)
        }
        
        // Create notification for artisan
        await database.collection('notifications').insertOne({
          id: crypto.randomUUID(),
          userId: artisanId,
          title: 'New Custom Request',
          message: `${user.displayName || 'A buyer'} has requested a custom product.`,
          type: 'custom_request',
          read: false,
          data: { requestId: customRequest.id },
          createdAt: new Date().toISOString()
        })
        
        return corsResponse({ 
          success: true, 
          request: customRequest,
          message: 'Request sent successfully'
        }, 201)
        
      } catch (err) {
        console.error('Custom request error:', err)
        return corsResponse({ error: 'Failed to create request' }, 500)
      }
    }

    // Get custom requests for artisan
    if (route === '/custom-requests/artisan' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const requests = await database.collection('customRequests')
          .find({ artisanId: user.uid })
          .sort({ createdAt: -1 })
          .toArray()
        
        return corsResponse({ 
          requests: requests.map(({_id, ...rest}) => rest),
          count: requests.length 
        })
      } catch (err) {
        console.error('Fetch requests error:', err)
        return corsResponse({ error: 'Failed to fetch requests' }, 500)
      }
    }

    // Get custom requests for buyer
    if (route === '/custom-requests/buyer' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const requests = await database.collection('customRequests')
          .find({ buyerId: user.uid })
          .sort({ createdAt: -1 })
          .toArray()
        
        return corsResponse({ 
          requests: requests.map(({_id, ...rest}) => rest),
          count: requests.length 
        })
      } catch (err) {
        console.error('Fetch requests error:', err)
        return corsResponse({ error: 'Failed to fetch requests' }, 500)
      }
    }

    // Update custom request status (accept/reject)
    if (route === '/custom-requests/status' && method === 'PUT') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { requestId, status, responseMessage } = body
        const now = new Date().toISOString()
        
        const update = {
          status,
          updatedAt: now
        }
        if (responseMessage) {
          update.responseMessage = responseMessage
        }
        
        const result = await database.collection('customRequests').findOneAndUpdate(
          { id: requestId, artisanId: user.uid },
          { 
            $set: update,
            $push: {
              statusHistory: {
                status,
                date: now,
                note: responseMessage || `Request ${status}`
              }
            }
          },
          { returnDocument: 'after' }
        )
        
        if (!result) {
          return corsResponse({ error: 'Request not found' }, 404)
        }
        
        // Notify buyer
        await database.collection('notifications').insertOne({
          id: crypto.randomUUID(),
          userId: result.buyerId,
          title: `Request ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
          message: `Your custom request has been ${status} by the artisan.`,
          type: 'custom_request_update',
          read: false,
          data: { requestId, status },
          createdAt: new Date().toISOString()
        })
        
        // Send email notification to buyer
        try {
          const { sendRequestStatusEmailToBuyer } = await import('@/lib/sendEmail')
          await sendRequestStatusEmailToBuyer(result, status, result.buyerEmail)
        } catch (emailErr) {
          console.log('Email sending failed:', emailErr.message)
        }
        
        return corsResponse({ 
          success: true, 
          request: result,
          message: `Request ${status} successfully`
        })
        
      } catch (err) {
        console.error('Update request error:', err)
        return corsResponse({ error: 'Failed to update request' }, 500)
      }
    }

    // --- Chat System ---
    // Send chat message
    if (route === '/chat' && method === 'POST') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const body = await request.json()
        const { requestId, message, senderRole } = body
        
        if (!requestId || !message) {
          return corsResponse({ error: 'requestId and message required' }, 400)
        }
        
        // Verify request exists and user is part of it
        const chatRequest = await database.collection('customRequests').findOne({
          id: requestId,
          $or: [
            { buyerId: user.uid },
            { artisanId: user.uid }
          ]
        })
        
        if (!chatRequest) {
          return corsResponse({ error: 'Request not found' }, 404)
        }
        
        // Only allow chat if request is accepted
        if (chatRequest.status !== 'accepted') {
          return corsResponse({ error: 'Chat only available for accepted requests' }, 403)
        }
        
        const chatMessage = {
          id: crypto.randomUUID(),
          requestId,
          senderId: user.uid,
          senderRole: senderRole || (user.uid === chatRequest.buyerId ? 'buyer' : 'artisan'),
          senderName: user.displayName || (senderRole === 'buyer' ? 'Buyer' : 'Artisan'),
          message,
          createdAt: new Date().toISOString()
        }
        
        await database.collection('chatMessages').insertOne(chatMessage)
        
        // Notify recipient
        const recipientId = user.uid === chatRequest.buyerId ? chatRequest.artisanId : chatRequest.buyerId
        await database.collection('notifications').insertOne({
          id: crypto.randomUUID(),
          userId: recipientId,
          title: 'New Message',
          message: `${chatMessage.senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
          type: 'chat_message',
          read: false,
          data: { requestId, chatId: chatMessage.id },
          createdAt: new Date().toISOString()
        })
        
        return corsResponse({ success: true, message: chatMessage }, 201)
      } catch (err) {
        console.error('Chat send error:', err)
        return corsResponse({ error: 'Failed to send message' }, 500)
      }
    }
    
    // Get chat messages for a request
    if (route === '/chat' && method === 'GET') {
      const user = await verifyToken(request)
      if (!user) return corsResponse({ error: 'Unauthorized' }, 401)
      
      try {
        const url = new URL(request.url)
        const requestId = url.searchParams.get('requestId')
        
        if (!requestId) {
          return corsResponse({ error: 'requestId required' }, 400)
        }
        
        // Verify user is part of this request
        const chatRequest = await database.collection('customRequests').findOne({
          id: requestId,
          $or: [
            { buyerId: user.uid },
            { artisanId: user.uid }
          ]
        })
        
        if (!chatRequest) {
          return corsResponse({ error: 'Request not found' }, 404)
        }
        
        const messages = await database.collection('chatMessages')
          .find({ requestId })
          .sort({ createdAt: 1 })
          .toArray()
        
        return corsResponse({ 
          messages: messages.map(({_id, ...rest}) => rest),
          count: messages.length 
        })
      } catch (err) {
        console.error('Chat fetch error:', err)
        return corsResponse({ error: 'Failed to fetch messages' }, 500)
      }
    }

    // 404
    return corsResponse({ error: `Route ${route} not found` }, 404)

  } catch (error) {
    console.error('API Error:', error)
    return corsResponse({ error: error.message || 'Internal server error' }, 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute

export async function OPTIONS() {
  return corsResponse({ status: 'ok' })
}
