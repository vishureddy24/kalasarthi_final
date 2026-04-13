'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Package, TrendingUp, ShieldAlert, Loader2 } from 'lucide-react'

export const ADMIN_EMAIL = 'vishureddy2401@gmail.com'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      setError('Access Denied. You do not have permissions to view this page.')
      return
    }

    if (!user) return

    async function fetchStats() {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch admin statistics')
        const data = await res.json()
        setStats(data)
      } catch (err) {
        setError(err.message)
      }
    }
    fetchStats()
  }, [user])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
        <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold font-display text-foreground">{error}</h2>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Please sign in with the designated administrator account to access this tool.
        </p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="pb-6 border-b border-border mb-6">
        <h1 className="text-3xl font-bold font-display text-foreground">Admin Control Panel</h1>
        <p className="text-muted-foreground mt-1">Platform overview and high-level health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-100 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Users</p>
                <h2 className="text-4xl font-bold text-foreground mt-1">{stats.users}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Package className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Orders</p>
                <h2 className="text-4xl font-bold text-foreground mt-1">{stats.orders}</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100 hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Revenue</p>
                <h2 className="text-4xl font-bold text-foreground mt-1">₹ {stats.revenue?.toLocaleString('en-IN')}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* We can place additional advanced analytics or recent actions below in future */}
    </div>
  )
}
