'use client'


import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, User, MapPin, Briefcase, Star, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ArtisanProfilePage({ params }) {
  const { id } = params
  const { user } = useAuth()
  const { tx } = useLanguage()
  const router = useRouter()
  
  const [artisan, setArtisan] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const [artisanRes, productsRes] = await Promise.all([
          fetch(`/api/artisans/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`/api/products?artisanId=${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])
        
        if (artisanRes.ok) {
          const artisanData = await artisanRes.json()
          setArtisan(artisanData.artisan)
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json()
          setProducts(productsData.products || [])
        }
      } catch (err) {
        console.error('Failed to fetch artisan:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!artisan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Artisan not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link 
            href="/dashboard/marketplace" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Artisan Profile Header */}
        <Card className="mb-8 border-primary/10">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Profile Image */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {artisan.profileImage ? (
                  <img 
                    src={artisan.profileImage} 
                    alt={artisan.displayName} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <User className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                )}
              </div>
              
              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <h1 className="text-2xl md:text-3xl font-bold">{artisan.displayName}</h1>
                  <Button 
                    onClick={() => router.push(`/artisans/${id}/request`)}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Request Custom Product
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                  {artisan.craftType && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {artisan.craftType}
                    </span>
                  )}
                  {artisan.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {artisan.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-amber-500" />
                    {artisan.rating || '4.5'} ({artisan.reviewCount || '12'} reviews)
                  </span>
                </div>
                
                {artisan.bio && (
                  <p className="text-muted-foreground max-w-2xl">{artisan.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Products by {artisan.displayName}
          </h2>
          
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <div className="aspect-square bg-secondary/50 relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    {product.category && (
                      <Badge className="absolute top-2 left-2 bg-primary/90">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{product.title}</h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      ₹{product.price?.toLocaleString('en-IN')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
