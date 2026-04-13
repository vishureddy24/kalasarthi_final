'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const { login, demoLogin, logout, user, userProfile, loading } = useAuth()
  const router = useRouter()

  // 🚀 INSTANT REDIRECT: If already logged in, redirect immediately
  useEffect(() => {
    if (user && !loading) {
      // User is logged in - redirect based on onboarding status
      if (userProfile?.isOnboarded) {
        router.replace('/dashboard')
      } else {
        router.replace('/onboarding')
      }
    }
  }, [user, userProfile, loading, router])

  // Show minimal loading state (max 300ms typically)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // 🔥 OPTIMIZED: Redirect immediately after login success
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      // 🚀 REDIRECT IMMEDIATELY - don't wait for profile
      router.replace('/onboarding')
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' ? 'Invalid email or password' : err.message
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async () => {
    setError('')
    setIsDemoLoading(true)
    try {
      await demoLogin()
      toast.success('Welcome to the demo!')
      // 🚀 REDIRECT IMMEDIATELY - don't wait for profile
      router.replace('/onboarding')
    } catch (err) {
      setError(err.message || 'Demo login failed')
      toast.error('Demo login failed')
      setIsDemoLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-500 via-orange-600 to-amber-800 relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay" />
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-white">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="h-10 w-10" />
            <h1 className="text-5xl font-bold font-display">KalaSarthi</h1>
          </div>
          <p className="text-xl text-amber-100 text-center max-w-md leading-relaxed">
            Connecting India's finest artisans with the world through AI-powered craftsmanship
          </p>
          <img
            src="https://images.unsplash.com/photo-1622825312256-fec995a8bbdd?w=500&h=400&fit=crop"
            alt="Indian handicrafts"
            className="mt-10 rounded-2xl shadow-2xl max-w-sm opacity-90 border-2 border-white/20"
          />
          <p className="mt-8 text-amber-200 text-sm text-center max-w-xs italic">
            "Every handcrafted piece tells a story of tradition, skill, and passion"
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold gradient-text font-display">KalaSarthi</h1>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2 font-display">Welcome Back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your KalaSarthi account</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11" />
            </div>
            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or</span></div>
          </div>

          <Button variant="outline" onClick={handleDemoLogin} className="w-full h-11 border-amber-300 text-amber-700 hover:bg-amber-50" disabled={isDemoLoading}>
            {isDemoLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Try Demo Account
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="text-amber-600 font-medium hover:underline">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
