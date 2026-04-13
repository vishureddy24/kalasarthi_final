'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  User, 
  MapPin, 
  Star, 
  Briefcase, 
  Phone, 
  Search,
  MessageCircle,
  Filter
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ArtisansClient() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  
  const [artisans, setArtisans] = useState([])
  const [filteredArtisans, setFilteredArtisans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCraft, setSelectedCraft] = useState('All')

  const craftTypes = ['All', 'Pottery', 'Weaving', 'Woodwork', 'Jewelry', 'Painting', 'Metalwork', 'Textiles']

  useEffect(() => {
    async function fetchArtisans() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/artisans', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setArtisans(data.artisans || [])
          setFilteredArtisans(data.artisans || [])
        }
      } catch (err) {
        console.error('Failed to fetch artisans:', err)
        toast.error('Failed to load artisans')
      } finally {
        setLoading(false)
      }
    }
    fetchArtisans()
  }, [user])

  // Filter artisans
  useEffect(() => {
    let filtered = artisans
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        (a.displayName?.toLowerCase().includes(query)) ||
        (a.location?.toLowerCase().includes(query)) ||
        (a.craftType?.toLowerCase().includes(query))
      )
    }
    
    if (selectedCraft !== 'All') {
      filtered = filtered.filter(a => 
        a.craftType?.toLowerCase().includes(selectedCraft.toLowerCase())
      )
    }
    
    setFilteredArtisans(filtered)
  }, [searchQuery, selectedCraft, artisans])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, location, or craft..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          {craftTypes.map((craft) => (
            <button
              key={craft}
              onClick={() => setSelectedCraft(craft)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCraft === craft
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {craft}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredArtisans.length} artisans
      </p>

      {/* Artisans Grid */}
      {filteredArtisans.length === 0 ? (
        <div className="text-center py-20">
          <User className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No artisans found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtisans.map((artisan) => (
            <Card key={artisan.id} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="relative h-48 bg-gradient-to-br from-primary/10 to-secondary">
                {artisan.profileImage ? (
                  <img src={artisan.profileImage} alt={artisan.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-20 w-20 text-primary/30" />
                  </div>
                )}
                {artisan.craftType && (
                  <Badge className="absolute top-3 left-3 bg-white/90 text-foreground">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {artisan.craftType}
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg truncate">{artisan.displayName}</h3>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{artisan.rating || '4.5'}</span>
                  </div>
                </div>

                {artisan.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                    <MapPin className="h-3 w-3" />
                    {artisan.location}
                  </p>
                )}

                {artisan.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                    <Phone className="h-3 w-3" />
                    {artisan.phone}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/artisans/${artisan.id}`}>View Profile</Link>
                  </Button>
                  <Button className="flex-1 gap-1" asChild>
                    <Link href={`/artisans/${artisan.id}/request`}>
                      <MessageCircle className="h-4 w-4" />
                      Contact
                    </Link>
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
