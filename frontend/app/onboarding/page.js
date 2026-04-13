'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Palette, ShoppingBag, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted rounded-b-lg flex items-center justify-center text-muted-foreground">Loading map...</div>
})

const CRAFT_TYPES = [
  'Textiles & Weaving', 'Pottery & Ceramics', 'Jewelry & Accessories',
  'Woodwork & Carving', 'Paintings & Art', 'Metalwork',
  'Leather Goods', 'Bamboo & Cane', 'Block Printing', 'Embroidery', 'Other'
]

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal'
]

export default function OnboardingPage() {
  const { user, userProfile, loading, refreshProfile } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [craftType, setCraftType] = useState('')
  const [location, setLocation] = useState('')
  const [experience, setExperience] = useState('')
  const [bio, setBio] = useState('')
  const [interests, setInterests] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [mapPosition, setMapPosition] = useState(null)

  // Move redirects to useEffect to avoid React warning
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    if (!loading && user && userProfile?.isOnboarded) {
      router.replace('/dashboard')
    }
  }, [loading, user, userProfile, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || userProfile?.isOnboarded) {
    return null
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const body = {
        role,
        displayName: displayName || user.displayName || 'User',
        phone,
        craftType: role === 'artisan' ? craftType : '',
        location: role === 'artisan' ? location : '',
        experience: role === 'artisan' ? experience : '',
        bio: role === 'artisan' ? bio : '',
        lat: role === 'artisan' && mapPosition ? mapPosition.lat : null,
        lng: role === 'artisan' && mapPosition ? mapPosition.lng : null,
        interests: role === 'buyer' ? interests.split(',').map(s => s.trim()).filter(Boolean) : [],
        address: role === 'buyer' ? address : '',
        city: role === 'buyer' ? city : '',
        state: role === 'buyer' ? state : '',
      }
      const res = await fetch('/api/user/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Onboarding failed')
      }
      await refreshProfile()
      toast.success('Profile setup complete!')
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
      toast.error(err.message)
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background pattern-overlay">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-display gradient-text">KalaSarthi</h1>
          </div>
          <h2 className="text-2xl font-bold text-foreground font-display">
            {step === 0 ? 'Choose Your Role' : 'Complete Your Profile'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {step === 0 ? 'How would you like to use KalaSarthi?' : `Set up your ${role} profile to get started`}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 0 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-2 w-16 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          </div>
          
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            onClick={() => {
              console.log('Navigating to login...')
              router.push('/login')
            }}
            className="mt-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>
        )}

        {step === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${role === 'artisan' ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'hover:border-primary/50'}`}
              onClick={() => { setRole('artisan'); setStep(1) }}
            >
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5">
                  <Palette className="h-10 w-10 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-display">I'm an Artisan</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Showcase your handcrafted products, get AI-powered descriptions, and connect with buyers worldwide
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Sell Products</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">AI Tools</span>
                  <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">Analytics</span>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${role === 'buyer' ? 'ring-2 ring-secondary shadow-xl scale-[1.02]' : 'hover:border-secondary/50'}`}
              onClick={() => { setRole('buyer'); setStep(1) }}
            >
              <CardContent className="flex flex-col items-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center mb-5">
                  <ShoppingBag className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold mb-2 font-display">I'm a Buyer</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Discover authentic Indian handicrafts, support local artisans, and find unique handmade treasures
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Browse Crafts</span>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Support Artisans</span>
                  <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-full">Unique Items</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <Card className="animate-fade-in">
            <CardContent className="p-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label>Display Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={user.displayName || 'Your name'} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="h-11" />
                </div>

                {role === 'artisan' && (
                  <>
                    <div className="space-y-2">
                      <Label>Craft Type</Label>
                      <Select value={craftType} onValueChange={setCraftType}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Select your craft" /></SelectTrigger>
                        <SelectContent>
                          {CRAFT_TYPES.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your city or village" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pinpoint Location on Map</Label>
                      <MapPicker value={mapPosition} onChange={setMapPosition} />
                    </div>
                    <div className="space-y-2">
                      <Label>Years of Experience</Label>
                      <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g. 10 years" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about your craft journey..." rows={4} />
                    </div>
                  </>
                )}

                {role === 'buyer' && (
                  <>
                    <div className="space-y-2">
                      <Label>Interests (comma separated)</Label>
                      <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Pottery, Textiles, Jewelry..." className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Delivery Address</Label>
                      <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your full address" rows={2} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger className="h-11"><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-11">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Change Role
                  </Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                    Complete Setup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
