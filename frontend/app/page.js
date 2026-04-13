'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { user, userProfile, loading } = useAuth()
  const { tx } = useLanguage()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else if (userProfile?.isOnboarded) {
        router.replace('/dashboard')
      } else {
        router.replace('/onboarding')
      }
    }
  }, [user, userProfile, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background pattern-overlay">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <span className="text-2xl text-white font-bold font-display">K</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">{tx('loading')}</p>
      </div>
    </div>
  )
}
