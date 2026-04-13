'use client'


import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, User, Mail, MapPin, Phone, Briefcase, Camera, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth()
  const { tx } = useLanguage()
  const { toast } = useToast()
  const fileInputRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    craftType: '',
    experience: '',
    profileImage: ''
  })

  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        craftType: userProfile.craftType || '',
        experience: userProfile.experience || '',
        profileImage: userProfile.profileImage || ''
      })
    }
  }, [userProfile])

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' })
        return
      }
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!previewImage) return formData.profileImage
    
    setUploadingImage(true)
    try {
      const fileInput = fileInputRef.current
      const file = fileInput.files[0]
      
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'kalasarthi')
      data.append('cloud_name', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'}/image/upload`,
        {
          method: 'POST',
          body: data,
        }
      )

      const result = await res.json()
      if (result.secure_url) {
        return result.secure_url
      }
    } catch (err) {
      console.error('Image upload error:', err)
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' })
    } finally {
      setUploadingImage(false)
    }
    return formData.profileImage
  }

  // Remove preview
  const removePreview = () => {
    setPreviewImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Upload image if changed
      const imageUrl = await uploadImage()
      
      const token = await user.getIdToken()
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          profileImage: imageUrl
        })
      })

      if (res.ok) {
        toast({ title: 'Success', description: 'Profile updated successfully' })
        setPreviewImage(null)
        refreshProfile()
      } else {
        throw new Error('Failed to update')
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Update Profile</h1>

      {/* Profile Photo Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Profile Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : formData.profileImage ? (
                  <img 
                    src={formData.profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="h-12 w-12 text-primary" />
                )}
              </div>
              {previewImage && (
                <button
                  onClick={removePreview}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="profile-image"
              />
              <label htmlFor="profile-image">
                <Button 
                  variant="outline" 
                  className="cursor-pointer"
                  asChild
                >
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    Change Photo
                  </span>
                </Button>
              </label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" /> Display Name
              </Label>
              <Input
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email
              </Label>
              <Input
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> Phone Number
              </Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Location
              </Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, State"
              />
            </div>

            {userProfile?.role === 'artisan' && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Craft Type
                  </Label>
                  <Input
                    value={formData.craftType}
                    onChange={(e) => setFormData({ ...formData, craftType: e.target.value })}
                    placeholder="e.g., Pottery, Weaving"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g., 5 years"
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Bio / About</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={loading || uploadingImage}
            className="w-full md:w-auto"
          >
            {loading || uploadingImage ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {uploadingImage ? 'Uploading...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
