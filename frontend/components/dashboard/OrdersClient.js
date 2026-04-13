'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Package, Calendar, FileText, Star, RefreshCw, Truck, MapPin, Download, Receipt } from 'lucide-react'
import OrderTimeline from '@/components/OrderTimeline'

export default function OrdersClient() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // GST Invoice Download Function - Uses secure backend API
  const downloadInvoice = async (order) => {
    // If we have a persistent Cloudinary URL, use it directly (optimized for IDX)
    if (order.invoiceUrl) {
      window.open(order.invoiceUrl, '_blank')
      toast.success('Opening GST Invoice...')
      return
    }

    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/invoice/${order.id || order._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Invoice API error:', errorData)
        throw new Error(errorData.error || errorData.details || `Failed to generate invoice: ${res.status}`)
      }

      // Get PDF blob
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      // Download
      const link = document.createElement('a')
      link.href = url
      link.download = `KalaSarthi-GST-Invoice-${order.invoiceNumber || order.id?.slice(-8) || 'download'}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('GST Invoice downloaded!')
    } catch (err) {
      console.error('Invoice download error:', err)
      toast.error('Failed to download invoice')
    }
  }

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const ordersWithDelivery = (data.orders || []).map(order => ({
            ...order,
            expectedDelivery: order.expectedDelivery || new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
          }))
          setOrders(ordersWithDelivery)
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user])

  const submitRating = async () => {
    if (rating === 0) return
    setSubmitting(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productId: selectedOrder.items[0]?.productId,
          rating,
          comment: review
        })
      })
      if (res.ok) {
        setRatingOpen(false)
        setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, rated: true } : o))
      }
    } catch (err) {
      console.error('Failed to submit rating:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReorder = async (order) => {
    try {
      const token = await user.getIdToken()
      for (const item of order.items) {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity
          })
        })
      }
      window.location.href = '/dashboard/cart'
    } catch (err) {
      console.error('Failed to reorder:', err)
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'paid': 'bg-green-100 text-green-800 border-green-200',
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'shipped': 'bg-purple-100 text-purple-800 border-purple-200',
      'out_for_delivery': 'bg-orange-100 text-orange-800 border-orange-200',
      'delivered': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200',
      'failed': 'bg-red-100 text-red-800 border-red-200'
    }
    return variants[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground">{tx('myOrders')}</h2>
        <Badge variant="outline" className="bg-secondary/50 text-primary">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </Badge>
      </div>
      
      {orders.length === 0 ? (
        <Card className="text-center py-20 border-primary/10 bg-gradient-to-b from-card to-secondary/20">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Package className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No orders yet</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
              Start exploring our handcrafted collection and your orders will appear here.
            </p>
            <Button 
              className="mt-6 bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = '/dashboard/marketplace'}
            >
              Browse Marketplace
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {orders.map((order, i) => (
            <Card key={order.id || i} className="overflow-hidden border-primary/10 shadow-sm">
              <CardHeader className="bg-secondary/30 border-b border-primary/10 py-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">Order #{order.id?.slice(-8).toUpperCase() || 'Unknown'}</span>
                    <Badge className={`capitalize ${getStatusBadge(order.status)} border`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-4 h-4" /> 
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="font-semibold text-primary">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </CardHeader>
              {/* Rest of order content... */}
              <CardContent className="p-0">
                <div className="p-6 border-b border-primary/10 bg-secondary/10">
                  <OrderTimeline timeline={order.timeline || []} />
                </div>
                <div className="divide-y divide-primary/10">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex p-5 gap-4 items-center hover:bg-secondary/20 transition-colors">
                      <div className="w-20 h-20 bg-secondary/50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-primary/10">
                        {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover" />}
                        {!item.image && <Package className="text-primary/30 w-8 h-8" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-secondary/20 border-t border-primary/10 flex justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => downloadInvoice(order)}>
                    <Receipt className="w-4 h-4 mr-2" /> GST Invoice
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
