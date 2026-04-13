'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import DocumentUpload from '@/components/DocumentUpload'
import OCRUpload from '@/components/OCRUpload'
import { 
  Landmark, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle,
  ExternalLink,
  Plus,
  ChevronRight,
  Upload,
  Loader2,
  Sparkles,
  Brain,
  TrendingUp,
  Wand2
} from 'lucide-react'
import { toast } from 'sonner'


export default function SchemesPage() {
  const { user, userProfile } = useAuth()
  const [applications, setApplications] = useState([])
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [schemesLoading, setSchemesLoading] = useState(true)
  const [selectedScheme, setSelectedScheme] = useState(null)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [formData, setFormData] = useState({
    businessName: '',
    yearsInBusiness: '',
    annualTurnover: '',
    employees: '',
    description: '',
    documents: []
  })
  const [autoFilling, setAutoFilling] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showAiSection, setShowAiSection] = useState(true)
  const [eligibilityChecks, setEligibilityChecks] = useState({})
  const [checkingEligibility, setCheckingEligibility] = useState({})
  const [govStats, setGovStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', label: 'All Schemes', icon: '🔍' },
    { id: 'Performing Arts', label: 'Performing Arts', icon: '🎭' },
    { id: 'Visual Arts', label: 'Visual Arts', icon: '🎨' },
    { id: 'Textile Arts', label: 'Textile Arts', icon: '🧵' },
    { id: 'Handicrafts', label: 'Handicrafts', icon: '🏺' },
    { id: 'General Arts', label: 'General Support', icon: '🎪' }
  ]

  const fetchApplications = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/schemes/my?artisanId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err)
    }
  }

  const fetchSchemes = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const role = userProfile?.role || 'artisan'
      const res = await fetch(`/api/schemes?role=${role}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSchemes(data.schemes || [])
      } else {
        console.error('Failed to fetch schemes:', res.status)
      }
    } catch (err) {
      console.error('Failed to fetch schemes:', err)
    } finally {
      setSchemesLoading(false)
      setLoading(false)
    }
  }

  const fetchAiRecommendations = async () => {
    if (!user) return
    setAiLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/schemes/recommend?artisanId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAiRecommendations(data.recommendations || [])
      }
    } catch (err) {
      console.error('Failed to fetch AI recommendations:', err)
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    fetchSchemes()
    fetchApplications()
    fetchAiRecommendations()
    fetchGovStats()
  }, [user, userProfile])

  const fetchGovStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/stats/government')
      if (res.ok) {
        const data = await res.json()
        setGovStats(data)
      }
    } catch (err) {
      console.error('Failed to fetch government stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const checkEligibilityForScheme = async (scheme) => {
    if (!user) {
      toast.error('Please login to check eligibility')
      return
    }
    
    setCheckingEligibility(prev => ({ ...prev, [scheme.id]: true }))
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/schemes/check-eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scheme,
          userProfile: {
            ...userProfile,
            age: userProfile?.age || 35,
            state: userProfile?.state || userProfile?.location || 'Delhi'
          }
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        setEligibilityChecks(prev => ({ ...prev, [scheme.id]: data.result }))
        
        if (data.result.eligible) {
          toast.success(`✅ You are eligible for ${scheme.name || scheme.title}!`)
        } else {
          toast.info(`⚠️ ${data.result.reason}`)
        }
      }
    } catch (err) {
      console.error('Eligibility check error:', err)
      toast.error('Failed to check eligibility')
    } finally {
      setCheckingEligibility(prev => ({ ...prev, [scheme.id]: false }))
    }
  }

  const handleAutoFill = async () => {
    if (!user || !selectedScheme) return
    setAutoFilling(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/schemes/autofill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          artisanId: user.uid,
          schemeId: selectedScheme.id
        })
      })
      if (res.ok) {
        const data = await res.json()
        setFormData(prev => ({
          ...prev,
          ...data.formData
        }))
        toast.success('Form auto-filled with AI!')
      } else {
        toast.error('Failed to auto-fill form')
      }
    } catch (err) {
      console.error('Auto-fill error:', err)
      toast.error('Failed to auto-fill form')
    } finally {
      setAutoFilling(false)
    }
  }

  // Listen for voice-triggered auto-fill
  useEffect(() => {
    const handleVoiceFill = () => {
      if (showApplyForm && selectedScheme) {
        handleAutoFill()
      }
    }
    window.addEventListener('voice-fill-form', handleVoiceFill)
    return () => window.removeEventListener('voice-fill-form', handleVoiceFill)
  }, [showApplyForm, selectedScheme])

  const handleApply = async (e) => {
    e.preventDefault()
    if (!user || !selectedScheme) return

    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/schemes/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          artisanId: user.uid,
          schemeId: selectedScheme.id,
          schemeName: selectedScheme.name,
          ministry: selectedScheme.ministry,
          status: 'submitted',
          data: {
            ...formData,
            artisanName: userProfile?.displayName || user.displayName,
            email: user.email
          }
        })
      })

      if (res.ok) {
        toast.success('Application submitted successfully!')
        setShowApplyForm(false)
        setSelectedScheme(null)
        setFormData({
          businessName: '',
          yearsInBusiness: '',
          annualTurnover: '',
          employees: '',
          description: '',
          documents: []
        })
        fetchApplications()
      } else {
        toast.error('Failed to submit application')
      }
    } catch (err) {
      console.error('Error submitting application:', err)
      toast.error('Failed to submit application')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-amber-600" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      submitted: 'bg-amber-100 text-amber-700 border-amber-200',
      approved: 'bg-green-100 text-green-700 border-green-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return variants[status] || variants.submitted
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Government Schemes</h1>
          <p className="text-muted-foreground">Apply for welfare schemes and track your applications</p>
        </div>
      </div>

      {/* Government Stats Section */}
      {govStats && (
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Government Support Data
              {statsLoading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {govStats.stats?.slice(0, 6).map((stat, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/60 border border-blue-100">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {stat.state || stat.state_ut || 'All India'}
                  </p>
                  <p className="text-lg font-semibold text-blue-700">
                    {stat.artisans || stat.number_of_artisans || stat.value || 'N/A'}
                  </p>
                  <p className="text-xs text-blue-600">
                    {stat.handicrafts || stat.sector || 'Artisans'}
                  </p>
                </div>
              ))}
            </div>
            {govStats.source === 'fallback' && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                {govStats.note}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations Section */}
      {showAiSection && (
        <Card className="border-purple-100 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI-Powered Recommendations
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                  Personalized for you
                </Badge>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAiSection(false)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your {userProfile?.craftType || userProfile?.category || 'artisan'} profile in {userProfile?.location || 'your region'}
            </p>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="h-5 w-5 animate-pulse" />
                  <span className="text-sm">AI is analyzing your profile...</span>
                </div>
              </div>
            ) : aiRecommendations.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No personalized recommendations available.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aiRecommendations?.map((rec, index) => (
                  <div 
                    key={rec.schemeId || index}
                    className="p-4 rounded-lg border bg-white hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedScheme(rec.scheme)
                      setShowApplyForm(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{rec.name}</h3>
                          <Badge 
                            variant="secondary" 
                            className="bg-green-100 text-green-700 text-xs"
                          >
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {rec.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-700 font-medium mb-1">
                          {rec.keyBenefit || rec.scheme?.benefits}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {rec.reason}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {rec.scheme?.ministry || rec.scheme?.category}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Click to apply</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!aiLoading && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Powered by Gemini AI
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchAiRecommendations}
                  className="text-xs"
                >
                  Refresh recommendations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* My Applications Section */}
      {applications.length > 0 && (
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-600" />
              My Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications?.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(app.status)}
                    <div>
                      <p className="font-medium">{app.schemeName}</p>
                      <p className="text-sm text-muted-foreground">{app.ministry}</p>
                      <p className="text-xs text-muted-foreground">
                        Applied on {new Date(app.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusBadge(app.status)}>
                    {app.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Schemes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Available Schemes</h2>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700">
            {schemes.length} schemes
          </Badge>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
        
        {schemesLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : schemes.length === 0 ? (
          <Card className="border-amber-100">
            <CardContent className="p-8 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No schemes available at the moment.</p>
              <p className="text-sm text-muted-foreground mb-4">Check back later for new government schemes.</p>
              <Button 
                onClick={async () => {
                  try {
                    const token = await user.getIdToken()
                    const res = await fetch('/api/admin/schemes/seed', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    if (res.ok) {
                      toast.success('Sample schemes loaded!')
                      fetchSchemes()
                    } else {
                      toast.error('Failed to load schemes')
                    }
                  } catch (err) {
                    toast.error('Error loading schemes')
                  }
                }}
                variant="outline"
                className="border-amber-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Load Sample Schemes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {schemes
              .filter(scheme => selectedCategory === 'all' || scheme.category === selectedCategory)
              .map((scheme) => (
              <Card key={scheme.id} className="border-amber-100 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg leading-tight">{scheme.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{scheme.ministry || scheme.category}</p>
                    </div>
                    <Landmark className="h-6 w-6 text-amber-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{scheme.description}</p>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Eligibility:</p>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(scheme.eligibility) ? scheme.eligibility.join(', ') : scheme.eligibility}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => checkEligibilityForScheme(scheme)}
                      disabled={checkingEligibility[scheme.id]}
                      className="text-xs"
                    >
                      {checkingEligibility[scheme.id] ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      )}
                      Check Eligibility
                    </Button>
                    <Button 
                      size="sm" 
                      className="gap-1"
                      onClick={() => {
                        setSelectedScheme(scheme)
                        setShowApplyForm(true)
                      }}
                    >
                      Apply Now
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {eligibilityChecks[scheme.id] && (
                    <div className={`mt-2 p-2 rounded text-xs ${
                      eligibilityChecks[scheme.id].eligible 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                      <span className="font-medium">
                        {eligibilityChecks[scheme.id].eligible ? '✅ Eligible' : '⚠️ Check Required'}
                      </span>
                      <p className="mt-1">{eligibilityChecks[scheme.id].reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal/Form */}
      {showApplyForm && selectedScheme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Apply for {selectedScheme.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedScheme.ministry}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setShowApplyForm(false)
                    setSelectedScheme(null)
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApply} className="space-y-4">
                {/* AI Auto-fill Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoFill}
                    disabled={autoFilling}
                    className="gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:bg-purple-100"
                  >
                    {autoFilling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 text-purple-600" />
                    )}
                    {autoFilling ? 'AI Filling...' : 'Auto Fill with AI'}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Enter your business name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Years in Business</Label>
                    <Input
                      type="number"
                      value={formData.yearsInBusiness}
                      onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                      placeholder="Years"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Turnover (₹)</Label>
                    <Input
                      type="number"
                      value={formData.annualTurnover}
                      onChange={(e) => setFormData({ ...formData, annualTurnover: e.target.value })}
                      placeholder="Turnover"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Number of Employees</Label>
                  <Input
                    type="number"
                    value={formData.employees}
                    onChange={(e) => setFormData({ ...formData, employees: e.target.value })}
                    placeholder="Enter number of employees"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Business Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your business and why you need this scheme..."
                    rows={3}
                    required
                  />
                </div>

                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-amber-800 mb-2">Required Documents:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {selectedScheme.documents?.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Document Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload Documents
                  </Label>
                  <DocumentUpload
                    user={user}
                    onUploadComplete={(data) => {
                      setFormData(prev => ({
                        ...prev,
                        documents: [...prev.documents, data.url]
                      }))
                      toast.success('Document uploaded successfully!')
                    }}
                  />
                  {formData.documents.length > 0 && (
                    <p className="text-sm text-green-600">
                      {formData.documents.length} document(s) uploaded
                    </p>
                  )}
                </div>

                {/* OCR Auto-fill */}
                <OCRUpload 
                  user={user}
                  documentType="aadhaar"
                  onDataExtracted={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      businessName: data.fullName || prev.businessName,
                      description: data.address || prev.description
                    }))
                  }}
                />

                <div className="flex gap-2 pt-2">
                  <Button type="submit" className="flex-1">
                    Submit Application
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setShowApplyForm(false)
                      setSelectedScheme(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
