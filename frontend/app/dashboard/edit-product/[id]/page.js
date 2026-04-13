'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowLeft, Package, Save } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Link as LinkIcon } from 'lucide-react'

const CATEGORIES = [
  'Textiles & Weaving', 'Pottery & Ceramics', 'Jewelry & Accessories',
  'Woodwork & Carving', 'Paintings & Art', 'Metalwork', 'Leather Goods',
  'Bamboo & Cane', 'Block Printing', 'Embroidery', 'Other'
]

export default function EditProductPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [craftType, setCraftType] = useState('')
  const [materials, setMaterials] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && productId) {
      fetchProduct()
    }
  }, [user, productId])

  const fetchProduct = async () => {
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        const product = data.product
        
        setTitle(product.title || '')
        setCategory(product.category || '')
        setCraftType(product.craftType || '')
        setMaterials(product.materials || '')
        setDimensions(product.dimensions || '')
        setPrice(product.price || '')
        setDescription(product.description || '')
        setImageUrl(product.imageUrl || '')
      } else {
        toast.error('Failed to fetch product')
        router.push('/dashboard/products')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !price) {
      toast.error('Please fill in required fields')
      return
    }

    setSaving(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          category,
          craftType,
          materials,
          dimensions,
          price: Number(price),
          description,
          imageUrl
        })
      })

      if (res.ok) {
        toast.success('Product updated successfully!')
        router.push('/dashboard/products')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to update product')
      }
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">Edit Product</h2>
          <p className="text-muted-foreground">Update your product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Product Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Handwoven Banarasi Silk Saree" className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Craft Type</Label>
                <Input value={craftType} onChange={(e) => setCraftType(e.target.value)} placeholder="e.g. Handloom" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Materials</Label>
                <Input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="e.g. Silk, Cotton" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label>Dimensions</Label>
                <Input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 6m x 1.2m" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price (Rs.) *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price in rupees" className="h-11" required min="0" />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product..." rows={6} />
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <ImageUpload 
                onUpload={(url) => setImageUrl(url)}
                onClear={() => setImageUrl('')}
                existingUrl={imageUrl}
              />
              
              <Collapsible className="mt-2">
                <CollapsibleTrigger asChild>
                  <button type="button" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Or use Image URL instead
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <Input 
                    value={imageUrl} 
                    onChange={(e) => setImageUrl(e.target.value)} 
                    placeholder="https://example.com/image.jpg" 
                    className="h-10" 
                  />
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/dashboard/products" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-11">Cancel</Button>
              </Link>
              <Button type="submit" disabled={saving} className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
