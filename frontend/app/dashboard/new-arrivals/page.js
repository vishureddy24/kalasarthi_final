'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Sparkles, Clock, ShoppingCart, Heart, Share2, Package } from 'lucide-react'

export default function NewArrivalsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNewArrivals() {
      try {
        const res = await fetch('/api/products/new-arrivals')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Failed to fetch new arrivals:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchNewArrivals()
  }, [])

  const addToCart = async (productId) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, quantity: 1 })
      })
    } catch (err) {
      console.error('Failed to add to cart:', err)
    }
  }

  const addToWishlist = async (productId) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId })
      })
    } catch (err) {
      console.error('Failed to add to wishlist:', err)
    }
  }

  const shareProduct = async (product) => {
    if (navigator.share) {
      await navigator.share({
        title: product.title,
        text: `Check out this beautiful ${product.craftType || 'handcrafted item'} on KalaSarthi!`,
        url: window.location.origin + `/product/${product._id}`
      })
    } else {
      navigator.clipboard.writeText(window.location.origin + `/product/${product._id}`)
    }
  }

  const getTimeAgo = (date) => {
    const hours = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground">New Arrivals</h2>
            <p className="text-sm text-muted-foreground">Fresh handcrafted items added in the last 48 hours</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-secondary/50 text-primary">
          {products.length} New
        </Badge>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="text-center py-20 border-primary/10 bg-gradient-to-b from-card to-secondary/20">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No new arrivals yet</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Check back soon for fresh handcrafted items from our artisans.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product._id} className="overflow-hidden border-primary/10 group">
              {/* Image */}
              <div className="relative aspect-square bg-secondary/30 overflow-hidden">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-primary/30" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <Badge className="bg-primary text-white border-0">
                    <Clock className="w-3 h-3 mr-1" /> {getTimeAgo(product.createdAt)}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => addToWishlist(product._id)}
                    className="p-2 rounded-full bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-500 shadow-sm transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => shareProduct(product)}
                    className="p-2 rounded-full bg-white/90 hover:bg-primary/10 text-gray-600 hover:text-primary shadow-sm transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground line-clamp-1">{product.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">by {product.artistName}</p>
                  </div>
                  <p className="font-semibold text-primary">₹{product.price?.toLocaleString('en-IN')}</p>
                </div>

                {product.craftType && (
                  <Badge variant="outline" className="mt-2 text-xs bg-secondary/30">
                    {product.craftType}
                  </Badge>
                )}

                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  size="sm"
                  onClick={() => addToCart(product._id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
