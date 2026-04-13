'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, ArrowLeft, Package, Wand2, Image as ImageIcon, Upload, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const CATEGORIES = [
  'Textiles & Weaving', 'Pottery & Ceramics', 'Jewelry & Accessories',
  'Woodwork & Carving', 'Paintings & Art', 'Metalwork', 'Leather Goods',
  'Bamboo & Cane', 'Block Printing', 'Embroidery', 'Other'
]

export default function AddProductPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [craftType, setCraftType] = useState(userProfile?.craftType || '')
  const [materials, setMaterials] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [generating, setGenerating] = useState(false)

  const handleGenerateDescription = async () => {
    if (!title) {
      toast.error('Please enter a product title first')
      return
    }
    setGenerating(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, category, craftType, materials }),
      })
      if (res.ok) {
        const data = await res.json()
        setDescription(data.description)
        toast.success('Description generated with AI!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to generate description')
      }
    } catch (err) {
      toast.error('Failed to generate description')
    }
    setGenerating(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !price) {
      toast.error('Please fill in required fields (title and price)')
      return
    }
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          category,
          craftType,
          materials,
          dimensions,
          imageUrl,
          artisanName: userProfile?.displayName || user?.displayName || 'Artisan',
        }),
      })
      if (res.ok) {
        toast.success('Product created successfully!')
        router.push('/dashboard/products')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create product')
      }
    } catch (err) {
      toast.error('Failed to create product')
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold font-display text-foreground">Add New Product</h2>
          <p className="text-muted-foreground">List your handcrafted masterpiece</p>
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
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={generating} className="text-purple-600 border-purple-200 hover:bg-purple-50">
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
                  {generating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your product or use AI to generate a description..." rows={6} />
            </div>

            <div className="space-y-2">
              <Label>Upload Image *</Label>
              <ImageUpload 
                onUpload={(url) => setImageUrl(url)}
                onClear={() => setImageUrl('')}
                existingUrl={imageUrl}
              />
              
              {/* Optional: Image URL for advanced users */}
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
              <Button type="submit" disabled={submitting} className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
                {submitting ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
