'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Package, Loader2, Map as MapIcon, Grid } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import ProductCard from '@/components/ProductCard'

const MapDisplay = dynamic(() => import('@/components/MapDisplay'), { ssr: false })

const CATEGORIES = [
  'All', 'Textiles & Weaving', 'Pottery & Ceramics', 'Jewelry & Accessories',
  'Woodwork & Carving', 'Paintings & Art', 'Metalwork', 'Leather Goods',
  'Bamboo & Cane', 'Block Printing', 'Embroidery'
]

export default function MarketplacePage() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  const [products, setProducts] = useState([])
  const [artisans, setArtisans] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [wishlistIds, setWishlistIds] = useState([])

  // Fetch all data in parallel on load
  useEffect(() => {
    async function fetchAll() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const [resProd, resArtisan, resWishlist] = await Promise.all([
          fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/artisans', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/wishlist', { headers: { Authorization: `Bearer ${token}` } })
        ])
        if (resProd.ok) {
          const data = await resProd.json()
          console.log('Products from API:', data.products?.[0]) // Debug first product
          setProducts(data.products || [])
        }
        if (resArtisan.ok) {
          const data = await resArtisan.json()
          setArtisans(data.artisans || [])
        }
        if (resWishlist.ok) {
          const data = await resWishlist.json()
          setWishlistIds(data.wishlist?.map(w => w.productId) || [])
        }
      } catch (err) {
        console.error('Failed to fetch:', err)
      }
      setLoading(false)
    }
    fetchAll()
  }, [user])

  useEffect(() => {
    const handleVoiceSearch = (e) => {
      setSearch(e.detail.keyword)
      setViewMode('grid')
    }
    window.addEventListener('ks-voice-search', handleVoiceSearch)
    return () => window.removeEventListener('ks-voice-search', handleVoiceSearch)
  }, [])

  useEffect(() => {
    let filtered = products.filter(p => p.isActive !== false)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.artisanName?.toLowerCase().includes(q)
      )
    }
    setFilteredProducts(filtered)
  }, [products, selectedCategory, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold font-display text-foreground">{tx('marketplace')}</h2>
        <p className="text-muted-foreground">{tx('exploreHandcrafted')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={tx('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex bg-muted rounded-xl p-1 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="w-4 h-4" /> Grid
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'map' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapIcon className="w-4 h-4" /> {tx('artisanMap')}
          </button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat === 'All' ? tx('allCategories') : cat}
            </button>
          ))}
        </div>
      )}

      {viewMode === 'map' ? (
        <MapDisplay artisans={artisans} />
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">{tx('noProducts')}</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || selectedCategory !== 'All'
                  ? tx('tryFilters')
                  : tx('checkBack')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  initialIsWishlisted={wishlistIds.includes(product.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
