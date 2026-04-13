'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Package, Calendar, FileText, Star, RefreshCw, Truck, MapPin, Download } from 'lucide-react'
import OrderTimeline from '@/components/OrderTimeline'

export default function OrdersPage() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingOpen, setRatingOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  const handleRateProduct = (order) => {
    setSelectedOrder(order)
    setRating(0)
    setReview('')
    setRatingOpen(true)
  }

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

  const downloadInvoice = (order) => {
    if (order.invoicePath) {
      const invoiceUrl = `${window.location.origin}/invoices/${order.invoicePath.split('/').pop()}`
      window.open(invoiceUrl, '_blank')
    }
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
                    {order.timeline?.some(t => t.status === 'delivered') && !order.rated && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-yellow-400 text-yellow-700 hover:bg-yellow-50"
                        onClick={() => handleRateProduct(order)}
                      >
                        <Star className="w-3 h-3 mr-1 fill-yellow-400" /> Rate
                      </Button>
                    )}
                    {order.rated && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Star className="w-3 h-3 mr-1 fill-green-500" /> Rated
                      </Badge>
                    )}
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

              <div className="px-6 py-3 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-6 text-sm flex-wrap">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>Expected Delivery:</span>
                    <span className="font-medium text-foreground">
                      {new Date(order.expectedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  {order.trackingInfo?.trackingNumber && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>Tracking:</span>
                      <span className="font-medium text-foreground">{order.trackingInfo.trackingNumber}</span>
                      <span className="text-xs text-muted-foreground">({order.trackingInfo.courier})</span>
                    </div>
                  )}
                </div>
              </div>

              <CardContent className="p-0">
                <div className="p-6 border-b border-primary/10 bg-secondary/10">
                  <OrderTimeline timeline={order.timeline || []} />
                </div>

                <div className="divide-y divide-primary/10">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex p-5 gap-4 items-center hover:bg-secondary/20 transition-colors">
                      <div className="w-20 h-20 bg-secondary/50 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-primary/10">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="text-primary/30 w-8 h-8" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                        {item.craftType && (
                          <Badge variant="outline" className="mt-2 text-xs bg-secondary/30">
                            {item.craftType}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString('en-IN')} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-secondary/20 border-t border-primary/10 flex justify-end gap-3">
                  {order.invoiceGenerated && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadInvoice(order)}
                      className="border-primary/20 hover:bg-primary/10"
                    >
                      <Download className="w-4 h-4 mr-2" /> Invoice
                    </Button>
                  )}
                  {order.status === 'delivered' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order)}
                      className="border-primary/20 hover:bg-primary/10"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Reorder
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={ratingOpen} onOpenChange={setRatingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Rate Your Purchase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 transition-all ${star <= rating ? 'scale-110' : ''}`}
                >
                  <Star 
                    className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                    strokeWidth={star <= rating ? 0 : 2}
                    style={{ filter: star <= rating ? 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' : 'none' }}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {rating === 0 && 'Tap a star to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </p>
            <Textarea
              placeholder="Share your experience with this product... (optional)"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setRatingOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-primary hover:bg-primary/90" 
                onClick={submitRating}
                disabled={rating === 0 || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
