"use client";

import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Loader2, MessageSquare, Users } from 'lucide-react'

// Lazy load heavy floating components
const VoiceButton = lazy(() => import('@/components/VoiceButton'))
const Chatbot = lazy(() => import('@/components/Chatbot'))

// Menu definitions
const artisanMenu = [
  { href: '/dashboard', labelKey: 'dashboard', icon: 'LayoutDashboard' },
  { href: '/dashboard/requests', labelKey: 'customRequests', icon: 'MessageSquare' },
  { href: '/dashboard/products', labelKey: 'myProducts', icon: 'Package' },
  { href: '/dashboard/add-product', labelKey: 'addProduct', icon: 'PlusCircle' },
  { href: '/dashboard/ai-tools', labelKey: 'aiTools', icon: 'Sparkles' },
  { href: '/dashboard/khata', labelKey: 'digitalKhata', icon: 'Wallet' },
  { href: '/dashboard/schemes', labelKey: 'govtSchemes', icon: 'Landmark' },
]

const buyerMenu = [
  { href: '/dashboard', labelKey: 'dashboard', icon: 'LayoutDashboard' },
  { href: '/artisans', labelKey: 'browseArtisans', icon: 'Users' },
  { href: '/dashboard/marketplace', labelKey: 'marketplace', icon: 'Store' },
  { href: '/dashboard/my-requests', labelKey: 'myRequests', icon: 'MessageSquare' },
  { href: '/dashboard/new-arrivals', labelKey: 'newArrivals', icon: 'Sparkles' },
  { href: '/dashboard/orders', labelKey: 'myOrders', icon: 'ShoppingBag' },
  { href: '/dashboard/wishlist', labelKey: 'wishlist', icon: 'Heart' },
  { href: '/dashboard/coupons', labelKey: 'coupons', icon: 'TicketPercent' },
  { href: '/dashboard/cart', labelKey: 'cart', icon: 'ShoppingCart' },
]

export default function DashboardLayout({ children }) {
  const { user, userProfile, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { tx } = useLanguage()
  
  // Memoize computed values
  const isAdmin = useMemo(() => 
    user?.email === 'vishureddy2401@gmail.com', 
    [user?.email]
  )
  
  const menuItems = useMemo(() => {
    return userProfile?.role === 'artisan' ? artisanMenu : buyerMenu
  }, [userProfile?.role])

  // Auth redirects in useEffect, not render
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
    if (!loading && user && !userProfile?.isOnboarded) {
      router.replace('/onboarding')
    }
  }, [loading, user, userProfile?.isOnboarded, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !userProfile?.isOnboarded) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 bg-sidebar flex-col border-r border-sidebar-border">
        <Sidebar
          menuItems={menuItems}
          pathname={pathname}
          userProfile={userProfile}
          user={user}
          isAdmin={isAdmin}
          onClose={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          tx={tx}
        />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar">
            <Sidebar
              mobile
              menuItems={menuItems}
              pathname={pathname}
              userProfile={userProfile}
              user={user}
              isAdmin={isAdmin}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
              tx={tx}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          userProfile={userProfile}
          pathname={pathname}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          router={router}
        />

        <main className="flex-1 overflow-y-auto p-6 relative">
          {children}
        </main>
      </div>

      {/* Floating Components - Lazy Loaded */}
      <Suspense fallback={null}>
        <VoiceButton />
        <Chatbot />
      </Suspense>
    </div>
  )
}
