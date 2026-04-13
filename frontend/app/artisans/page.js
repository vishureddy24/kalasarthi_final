import ArtisansClient from '@/components/dashboard/ArtisansClient'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Our Artisans | KalaSarthi',
  description: 'Discover and connect with skilled Indian artisans',
}

export default function ArtisianPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back to Dashboard */}
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Discover Artisans</h1>
          <p className="text-muted-foreground">
            Connect with skilled craftsmen and request custom handmade products
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <ArtisansClient />
      </div>
    </div>
  )
}
