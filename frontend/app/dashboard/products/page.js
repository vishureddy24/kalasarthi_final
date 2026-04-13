'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Package, PlusCircle, Trash2, Edit, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ProductsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const handleEdit = (productId) => {
    router.push(`/dashboard/edit-product/${productId}`)
  }

  const fetchProducts = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/products?artisanId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      toast.error('Failed to load products')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()
  }, [user])

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to remove this product?')) return
    setDeleting(productId)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success('Product removed')
        fetchProducts()
      } else {
        toast.error('Failed to remove product')
      }
    } catch (err) {
      toast.error('Failed to remove product')
    }
    setDeleting(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">My Products</h2>
          <p className="text-muted-foreground">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link href="/dashboard/add-product">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No products yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-4">Start by adding your first handcrafted product</p>
            <Link href="/dashboard/add-product">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Your First Product
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className={`overflow-hidden transition-all hover:shadow-lg ${product.isActive === false ? 'opacity-60' : ''}`}>
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-12 w-12 text-amber-200" />
                )}
                {product.isActive === false && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="text-xs">Removed</Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
                  </div>
                  <p className="text-lg font-bold text-primary whitespace-nowrap">Rs. {product.price?.toLocaleString('en-IN')}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{product.description}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product.id)}>
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id || product.isActive === false}
                  >
                    {deleting === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
