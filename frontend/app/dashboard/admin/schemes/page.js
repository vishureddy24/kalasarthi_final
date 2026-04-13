'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Loader2,
  Landmark,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSchemesPage() {
  const { user } = useAuth()
  const [schemes, setSchemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingScheme, setEditingScheme] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    ministry: '',
    category: '',
    description: '',
    eligibility: '',
    documents: '',
    benefits: '',
    link: '',
    isActive: true
  })

  const checkAdmin = async () => {
    if (!user) return
    // Simple check - in production, use a proper admin claim
    if (user.email === 'vishureddy2401@gmail.com') {
      setIsAdmin(true)
    } else {
      toast.error('Admin access required')
    }
  }

  const fetchSchemes = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/schemes?role=all', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSchemes(data.schemes || [])
      }
    } catch (err) {
      console.error('Failed to fetch schemes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAdmin()
    fetchSchemes()
  }, [user])

  const handleSeedData = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/admin/schemes/seed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        fetchSchemes()
      } else if (data.skipped) {
        toast.info(data.message)
      } else {
        toast.error(data.error || 'Failed to seed')
      }
    } catch (err) {
      console.error('Seed error:', err)
      toast.error('Failed to seed data')
    }
  }

  const handleCreate = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const schemeData = {
        ...formData,
        eligibility: formData.eligibility.split(',').map(e => e.trim()),
        documents: formData.documents.split(',').map(d => d.trim())
      }
      
      const res = await fetch('/api/admin/schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(schemeData)
      })
      
      if (res.ok) {
        toast.success('Scheme created successfully')
        setIsCreating(false)
        resetForm()
        fetchSchemes()
      } else {
        toast.error('Failed to create scheme')
      }
    } catch (err) {
      console.error('Create error:', err)
      toast.error('Failed to create scheme')
    }
  }

  const handleUpdate = async () => {
    if (!user || !editingScheme) return
    try {
      const token = await user.getIdToken()
      const schemeData = {
        ...formData,
        id: editingScheme.id,
        eligibility: formData.eligibility.split(',').map(e => e.trim()),
        documents: formData.documents.split(',').map(d => d.trim())
      }
      
      const res = await fetch('/api/admin/schemes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(schemeData)
      })
      
      if (res.ok) {
        toast.success('Scheme updated successfully')
        setEditingScheme(null)
        resetForm()
        fetchSchemes()
      } else {
        toast.error('Failed to update scheme')
      }
    } catch (err) {
      console.error('Update error:', err)
      toast.error('Failed to update scheme')
    }
  }

  const handleDelete = async (id) => {
    if (!user || !confirm('Are you sure you want to delete this scheme?')) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/schemes?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        toast.success('Scheme deleted successfully')
        fetchSchemes()
      } else {
        toast.error('Failed to delete scheme')
      }
    } catch (err) {
      console.error('Delete error:', err)
      toast.error('Failed to delete scheme')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      ministry: '',
      category: '',
      description: '',
      eligibility: '',
      documents: '',
      benefits: '',
      link: '',
      isActive: true
    })
  }

  const startEdit = (scheme) => {
    setEditingScheme(scheme)
    setFormData({
      name: scheme.name,
      ministry: scheme.ministry || '',
      category: scheme.category || '',
      description: scheme.description,
      eligibility: Array.isArray(scheme.eligibility) ? scheme.eligibility.join(', ') : scheme.eligibility,
      documents: Array.isArray(scheme.documents) ? scheme.documents.join(', ') : scheme.documents,
      benefits: scheme.benefits || '',
      link: scheme.link || '',
      isActive: scheme.isActive !== false
    })
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="border-red-100">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-medium">Admin access required</p>
            <p className="text-sm text-muted-foreground mt-1">You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin: Scheme Management</h1>
          <p className="text-muted-foreground">Manage government schemes dynamically</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedData}>
            Seed Initial Data
          </Button>
          <Button onClick={() => { setIsCreating(true); resetForm(); }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New Scheme
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-amber-100">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Schemes</p>
            <p className="text-3xl font-bold">{schemes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-100">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Active Schemes</p>
            <p className="text-3xl font-bold text-green-600">
              {schemes.filter(s => s.isActive !== false).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Categories</p>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(schemes.map(s => s.category).filter(Boolean)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingScheme) && (
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle>{editingScheme ? 'Edit Scheme' : 'Create New Scheme'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scheme Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., PM Vishwakarma"
                />
              </div>
              <div className="space-y-2">
                <Label>Ministry</Label>
                <Input
                  value={formData.ministry}
                  onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                  placeholder="e.g., Ministry of MSME"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., employment, skill, design"
                />
              </div>
              <div className="space-y-2">
                <Label>Benefits</Label>
                <Input
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="e.g., ₹15,000 toolkit incentive"
                />
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the scheme..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label>Eligibility (comma-separated)</Label>
                <Input
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="e.g., artisan, women, rural"
                />
              </div>
              <div className="space-y-2">
                <Label>Required Documents (comma-separated)</Label>
                <Input
                  value={formData.documents}
                  onChange={(e) => setFormData({ ...formData, documents: e.target.value })}
                  placeholder="e.g., Aadhaar, Bank Account"
                />
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label>Official Link</Label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label>Active</Label>
            </div>

            <div className="flex gap-2 mt-4">
              <Button 
                onClick={editingScheme ? handleUpdate : handleCreate}
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {editingScheme ? 'Update Scheme' : 'Create Scheme'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreating(false)
                  setEditingScheme(null)
                  resetForm()
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schemes List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Schemes</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : schemes.length === 0 ? (
          <Card className="border-amber-100">
            <CardContent className="p-8 text-center">
              <Landmark className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No schemes found.</p>
              <p className="text-sm text-muted-foreground">Click "Seed Initial Data" or add a new scheme.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {schemes.map((scheme) => (
              <Card key={scheme.id} className={`border-amber-100 ${scheme.isActive === false ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{scheme.name}</h3>
                        <Badge variant={scheme.isActive !== false ? 'default' : 'secondary'}>
                          {scheme.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{scheme.ministry || scheme.category}</p>
                      <p className="text-sm mt-1">{scheme.description}</p>
                      <p className="text-sm text-green-600 mt-1">{scheme.benefits}</p>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.isArray(scheme.eligibility) ? scheme.eligibility.map(e => (
                          <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                        )) : (
                          <Badge variant="outline" className="text-xs">{scheme.eligibility}</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => startEdit(scheme)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(scheme.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
