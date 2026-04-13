'use client'


import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Upload, X, ArrowLeft, User, Phone, IndianRupee, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RequestPage({ params }) {
  const { id } = params
  const { user } = useAuth()
  const { tx } = useLanguage()
  
  const [artisan, setArtisan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [images, setImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  
  const [form, setForm] = useState({
    phone: '',
    message: '',
    budget: '',
    deadline: '',
  })

  // Fetch artisan details
  useEffect(() => {
    async function fetchArtisan() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/artisans/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setArtisan(data.artisan)
        }
      } catch (err) {
        console.error('Failed to fetch artisan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchArtisan()
  }, [id, user])

  // Handle image selection
  const handleImages = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 5) {
      toast.error('Maximum 5 images allowed')
      return
    }
    setImages(prev => [...prev, ...files])
  }

  // Remove image
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Upload images via server-side API
  const uploadImages = async () => {
    if (images.length === 0) return []
    
    setUploadingImages(true)
    const urls = []

    for (let file of images) {
      const data = new FormData()
      data.append('file', file)

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        })
        const result = await res.json()
        if (result.success && result.url) {
          urls.push(result.url)
        } else {
          toast.error('Failed to upload image')
        }
      } catch (err) {
        console.error('Image upload error:', err)
        toast.error('Upload failed')
      }
    }

    setUploadingImages(false)
    return urls
  }

  // Submit request
  const handleSubmit = async () => {
    if (!form.message.trim()) {
      toast.error('Please describe your requirement')
      return
    }
    if (!form.phone.trim()) {
      toast.error('Please provide your phone number')
      return
    }

    try {
      setSubmitting(true)
      
      const uploadedUrls = await uploadImages()
      const token = await user.getIdToken()

      const res = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          artisanId: id,
          message: form.message,
          budget: form.budget,
          deadline: form.deadline,
          sampleImages: uploadedUrls,
          buyerPhone: form.phone,
        })
      })

      if (res.ok) {
        toast.success('Request sent successfully! The artisan will contact you soon.')
        // Reset form
        setForm({ phone: '', message: '', budget: '', deadline: '' })
        setImages([])
      } else {
        throw new Error('Failed to send request')
      }
    } catch (err) {
      toast.error('Failed to send request. Please try again.')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link 
            href="/dashboard/marketplace" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Artisan Info */}
        {artisan && (
          <Card className="mb-6 border-primary/10">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {artisan.profileImage ? (
                  <img src={artisan.profileImage} alt={artisan.displayName} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <div>
                <h2 className="font-semibold text-lg">{artisan.displayName}</h2>
                <p className="text-sm text-muted-foreground">{artisan.craftType || 'Artisan'}</p>
                <p className="text-sm text-muted-foreground">{artisan.location}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Request Custom Product</CardTitle>
            <p className="text-sm text-muted-foreground">
              Describe what you need and the artisan will create it for you
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phone */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Your Phone Number *
              </Label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>Describe Your Requirement *</Label>
              <Textarea
                placeholder="Tell the artisan what you need - size, color, material, design preferences, occasion, etc."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={5}
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4" />
                Your Budget (₹)
              </Label>
              <Input
                type="number"
                placeholder="Enter your budget"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Needed By
              </Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Reference Images (Optional, Max 5)
              </Label>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImages}
                className="cursor-pointer"
              />
              
              {/* Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(img)}
                        alt={`Preview ${i + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={submitting || uploadingImages}
              className="w-full"
              size="lg"
            >
              {submitting || uploadingImages ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingImages ? 'Uploading Images...' : 'Sending Request...'}
                </>
              ) : (
                'Send Request to Artisan'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
