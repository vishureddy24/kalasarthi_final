'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Package, PlusCircle, Sparkles, Store, Eye, IndianRupee, 
  ShoppingBag, Heart, TicketPercent, Clock, ArrowRight 
} from 'lucide-react'

// Lazy load heavy chart components
const RevenueChart = dynamic(() => import('@/components/RevenueChart'), { 
  ssr: false,
  loading: () => <div className="h-64 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/></div>
})
const TopProducts = dynamic(() => import('@/components/TopProducts'), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"/></div>
})

export default function DashboardClient() {
  const { user, userProfile } = useAuth()
  const { tx } = useLanguage()
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    activeProducts: 0, 
    totalRevenue: 0, 
    totalOrders: 0,
    productsSold: 0
  })
  const [chartData, setChartData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [recentProducts, setRecentProducts] = useState([])

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        if (userProfile?.role === 'artisan') {
          // Fetch artisan stats with real-time revenue
          const statsRes = await fetch(`/api/artisan/stats?artisanId=${user.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats({
              totalProducts: statsData.totalProducts || 0,
              activeProducts: statsData.activeProducts || 0,
              totalRevenue: statsData.totalRevenue || 0,
              totalOrders: statsData.totalOrders || 0,
              productsSold: statsData.productsSold || 0,
            })
            setChartData(statsData.chartData || [])
            setTopProducts(statsData.topProducts || [])
          }

          // Fetch products for recent products section
          const productsRes = await fetch(`/api/products?artisanId=${user.uid}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (productsRes.ok) {
            const data = await productsRes.json()
            const products = data.products || []
            setRecentProducts(products.slice(0, 5))
          }
        } else {
          const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
          if (res.ok) {
            const data = await res.json()
            setRecentProducts((data.products || []).slice(0, 6))
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      }
    }
    
    fetchData()
    
    // Real-time polling every 30 seconds for artisans (reduced frequency)
    let interval
    if (userProfile?.role === 'artisan') {
      interval = setInterval(fetchData, 30000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user, userProfile])

  const isArtisan = userProfile?.role === 'artisan'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Heritage Theme Welcome Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary to-primary/5 rounded-2xl p-8 border border-primary/20">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground">
              {tx('namaste')}, {userProfile?.displayName || user?.displayName || 'User'}!
            </h2>
            <p className="text-muted-foreground mt-1">
              {isArtisan ? tx('manageProducts') : 'Discover authentic Indian crafts'}
            </p>
          </div>
          <div className="hidden sm:block w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {isArtisan ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{tx('totalProducts')}</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalProducts}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{tx('activeProducts')}</p>
                    <p className="text-3xl font-bold text-foreground">{stats.activeProducts}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{tx('orders') || 'Orders'}</p>
                    <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/10 hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{tx('revenue')}</p>
                    <p className="text-3xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <IndianRupee className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/add-product">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <PlusCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Add Product</h3>
                    <p className="text-sm text-muted-foreground">List a new handcrafted item</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/ai-tools">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Tools</h3>
                    <p className="text-sm text-muted-foreground">AI-powered business assistant</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/products">
              <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">My Products</h3>
                    <p className="text-sm text-muted-foreground">Manage your listings</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <RevenueChart data={chartData} title="Revenue Trend (Last 7 Days)" />
          <TopProducts products={topProducts} />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { href: '/dashboard/marketplace', icon: Store, title: 'Browse Marketplace', desc: 'Explore handcrafted items' },
              { href: '/dashboard/new-arrivals', icon: Clock, title: 'New Arrivals', desc: 'Fresh items added recently' },
              { href: '/dashboard/orders', icon: ShoppingBag, title: 'My Orders', desc: 'Track & rate purchases' },
              { href: '/dashboard/wishlist', icon: Heart, title: 'My Wishlist', desc: 'Save items for later' },
              { href: '/dashboard/coupons', icon: TicketPercent, title: 'My Coupons', desc: 'Available offers & deals' },
              { href: '/dashboard/cart', icon: Package, title: 'Shopping Cart', desc: 'View & checkout items' }
            ].map((item, idx) => (
              <Link key={idx} href={item.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group h-full">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground font-display">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {recentProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-display text-foreground">Featured Products</h3>
                <Link href="/dashboard/marketplace" className="text-sm text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all border-primary/10">
                    <div className="aspect-[4/3] bg-secondary/50 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-12 w-12 text-primary/30" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-foreground truncate">{product.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{product.artisanName}</p>
                      <p className="text-lg font-bold text-primary mt-2">₹{product.price?.toLocaleString('en-IN')}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
