'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, ShoppingCart, CheckCircle, X, Landmark, Wallet, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function Notifications({ user }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications from real API
  useEffect(() => {
    let isFetching = false
    let abortController = null
    
    async function fetchNotifications() {
      if (!user || isFetching) return
      isFetching = true
      
      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()
      
      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/notifications?userId=${user.uid}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal
        })
        if (res.ok) {
          const data = await res.json()
          const notifications = data.notifications || []
          
          // Format notifications with time
          const formattedNotifications = notifications.map(n => ({
            ...n,
            time: new Date(n.createdAt).toLocaleString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              day: 'numeric',
              month: 'short'
            })
          }))
          
          setNotifications(formattedNotifications)
          setUnreadCount(formattedNotifications.filter(n => !n.read).length)
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch notifications:', err)
        }
      } finally {
        isFetching = false
        abortController = null
      }
    }
    
    fetchNotifications()
    
    // Poll every 30 seconds (was 5s - causing pile-up when API is slow)
    const interval = setInterval(fetchNotifications, 30000)
    return () => {
      clearInterval(interval)
      if (abortController) {
        abortController.abort()
      }
    }
  }, [user])

  const markAsRead = async (id) => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId: id })
      })
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />
      case 'scheme':
        return <Landmark className="h-4 w-4" />
      case 'payment':
        return <Wallet className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-600'
      case 'scheme':
        return 'bg-purple-100 text-purple-600'
      case 'payment':
        return 'bg-green-100 text-green-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (!isOpen) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <Card className="w-80 absolute right-0 top-12 z-50 shadow-xl border-amber-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5 text-amber-600" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {unreadCount} new
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              Mark all read
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-80 overflow-y-auto space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No notifications yet
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`
                p-3 rounded-lg cursor-pointer transition-all
                ${notification.read ? 'bg-muted/50' : 'bg-amber-50 border border-amber-100'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${getNotificationColor(notification.type)}
                `}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${notification.read ? '' : 'text-foreground'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
