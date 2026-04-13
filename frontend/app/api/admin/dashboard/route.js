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
    // Check if admin email
    if (decoded.email !== 'vishureddy2401@gmail.com') return null
    return decoded
  } catch (err) {
    return null
  }
}

export async function GET(request) {
  const user = await verifyAdmin(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const database = await connectToMongo()
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || '7d' // 7d, 30d, all

    // Calculate date filter
    const now = new Date()
    let dateFilter = {}
    if (period === '7d') {
      dateFilter = { createdAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() } }
    } else if (period === '30d') {
      dateFilter = { createdAt: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString() } }
    }

    // Get all stats in parallel
    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      totalRevenue,
      totalUsers,
      totalArtisans,
      totalProducts,
      dailyRevenue,
      topProducts,
      recentOrders
    ] = await Promise.all([
      // Total orders count
      database.collection('orders').countDocuments(dateFilter),
      
      // Paid orders
      database.collection('orders').countDocuments({ ...dateFilter, status: 'paid' }),
      
      // Pending orders
      database.collection('orders').countDocuments({ ...dateFilter, status: 'pending' }),
      
      // Failed orders
      database.collection('orders').countDocuments({ ...dateFilter, status: 'failed' }),
      
      // Total revenue from paid orders
      database.collection('orders')
        .aggregate([
          { $match: { status: 'paid', ...dateFilter } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ])
        .toArray(),
      
      // Total users
      database.collection('users').countDocuments(),
      
      // Total artisans
      database.collection('users').countDocuments({ role: 'artisan' }),
      
      // Total products
      database.collection('products').countDocuments({ isActive: { $ne: false } }),
      
      // Daily revenue for chart
      database.collection('orders')
        .aggregate([
          { $match: { status: 'paid', ...dateFilter } },
          {
            $group: {
              _id: { $substr: ['$createdAt', 0, 10] },
              revenue: { $sum: '$total' },
              orders: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } },
          { $limit: 30 }
        ])
        .toArray(),
      
      // Top selling products
      database.collection('orders')
        .aggregate([
          { $match: { status: 'paid', ...dateFilter } },
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.productId',
              title: { $first: '$items.title' },
              totalSold: { $sum: '$items.quantity' },
              revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
            }
          },
          { $sort: { totalSold: -1 } },
          { $limit: 10 }
        ])
        .toArray(),
      
      // Recent orders
      database.collection('orders')
        .find(dateFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()
    ])

    return NextResponse.json({
      summary: {
        totalOrders,
        paidOrders,
        pendingOrders,
        failedOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalUsers,
        totalArtisans,
        totalProducts
      },
      dailyRevenue: dailyRevenue.map(d => ({
        date: d._id,
        revenue: d.revenue,
        orders: d.orders
      })),
      topProducts: topProducts.map(p => ({
        id: p._id,
        title: p.title,
        totalSold: p.totalSold,
        revenue: p.revenue
      })),
      recentOrders: recentOrders.map(({ _id, ...rest }) => rest)
    })

  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
