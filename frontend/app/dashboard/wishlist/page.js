'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

export default function WishlistPage() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWishlist() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          // API returns { wishlist: [...] } where each item has product nested
          setWishlist(data.wishlist || [])
        }
      } catch (err) {
        console.error('Failed to fetch wishlist:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [user])

  const removeFromWishlist = async (productId) => {
    try {
      const token = await user.getIdToken()
      await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setWishlist(wishlist.filter(item => item.productId !== productId))
    } catch (err) {
      console.error('Failed to remove from wishlist:', err)
    }
  }

  const addToCart = async (item) => {
    try {
      const token = await user.getIdToken()
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1
        })
      })
      // Optional: Show toast
    } catch (err) {
      console.error('Failed to add to cart:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground">My Wishlist</h2>
        <Badge variant="outline" className="bg-secondary/50 text-primary">
          {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
        </Badge>
      </div>

      {wishlist.length === 0 ? (
        <Card className="text-center py-20 border-primary/10 bg-gradient-to-b from-card to-secondary/20">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Your wishlist is empty</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Save your favorite handcrafted items here to buy them later.
            </p>
            <Button 
              className="mt-6 bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '/dashboard/marketplace'}
            >
              Explore Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wishlist.map((item) => (
            item.product && (
              <ProductCard
                key={item.productId}
                product={item.product}
                initialIsWishlisted={true}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}
