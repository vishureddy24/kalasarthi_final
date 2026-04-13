'use client'

import { useState } from 'react'
import { Heart, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export default function ProductCard({ product, initialIsWishlisted = false, showWishlist = true }) {
  const { user } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
  const [loading, setLoading] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const toggleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return
    setLoading(true)

    try {
      if (!user) {
        toast.error('Please login to add to wishlist')
        return
      }

      const token = await user.getIdToken()
      const res = await fetch('/api/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId: product.id })
      })

      const data = await res.json()

      if (res.ok) {
        setIsWishlisted(data.isWishlisted)
        toast.success(data.isWishlisted ? 'Added to wishlist ❤️' : 'Removed from wishlist')
      } else {
        toast.error(data.error || 'Failed to update wishlist')
      }
    } catch (err) {
      console.error('Wishlist error:', err)
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (addingToCart) return
    setAddingToCart(true)

    try {
      if (!user) {
        toast.error('Please login to add to cart')
        return
      }

      const token = await user.getIdToken()
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          title: product.title,
          price: product.price,
          image: product.images?.[0] || product.imageUrl,
          quantity: 1
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Added to cart 🛒')
      } else {
        toast.error(data.error || 'Failed to add to cart')
      }
    } catch (err) {
      console.error('Cart error:', err)
      toast.error('Something went wrong')
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Heart Icon */}
      {showWishlist && (
        <button
          onClick={toggleWishlist}
          disabled={loading}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 hover:scale-110"
        >
          <Heart
            className={`w-5 h-5 transition-all duration-200 ${
              isWishlisted 
                ? 'fill-red-500 text-red-500 scale-110' 
                : 'text-gray-400 hover:text-red-400'
            } ${loading ? 'opacity-50' : ''}`}
          />
        </button>
      )}

      {/* Product Image */}
      <Link href={`/dashboard/marketplace/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {(product.images?.[0] || product.imageUrl) ? (
            <img
              src={product.images?.[0] || product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          
          {/* Quick Add to Cart Overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={addToCart}
              disabled={addingToCart}
              className="w-full py-2 px-4 bg-primary text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/dashboard/marketplace/${product.id}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-primary transition-colors">
            {product.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 mt-1 capitalize">
          {product.category}
        </p>

        <div className="flex items-center justify-between mt-3">
          <p className="text-lg font-bold text-primary">
            ₹{product.price?.toLocaleString('en-IN')}
          </p>
          
          {product.rating && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span className="text-yellow-500">★</span>
              <span>{product.rating}</span>
            </div>
          )}
        </div>

        {/* Artisan Info */}
        {product.artisanName && (
          <p className="text-xs text-gray-400 mt-2 truncate">
            by {product.artisanName}
          </p>
        )}
      </div>
    </div>
  )
}
