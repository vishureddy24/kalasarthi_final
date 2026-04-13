'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2, ShoppingCart, CheckCircle2, Minus, Plus, Tag, Sparkles, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'

// Available coupons
const COUPONS = {
  'KALA10': { type: 'percentage', value: 10, minOrder: 500, description: '10% off on orders above ₹500' },
  'BANK10': { type: 'percentage', value: 10, minOrder: 1000, description: '10% off with any bank card (min ₹1000)' },
  'CRAFT500': { type: 'flat', value: 500, minOrder: 3000, description: 'Flat ₹500 off on orders above ₹3000' }
}

export default function CartPage() {
  const { user } = useAuth()
  const { tx } = useLanguage()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState({})
  const [checkingOut, setCheckingOut] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)

  const fetchCart = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCart()
    // Check for stored coupon
    const storedCoupon = localStorage.getItem('appliedCoupon')
    if (storedCoupon && COUPONS[storedCoupon]) {
      setAppliedCoupon({ code: storedCoupon, ...COUPONS[storedCoupon] })
    }
  }, [user])

  const updateQuantity = async (productId, newQty) => {
    if (newQty < 1) return
    setUpdating(prev => ({ ...prev, [productId]: true }))
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/cart/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ productId, quantity: newQty })
      })
      
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
      }
    } catch (err) {
      toast.error('Failed to update quantity')
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }))
    }
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    setCouponError('')
    
    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }

    const coupon = COUPONS[code]
    if (!coupon) {
      setCouponError('Invalid coupon code')
      return
    }

    const subtotal = cart?.totalAmount || 0
    if (subtotal < coupon.minOrder) {
      setCouponError(`Minimum order amount is ₹${coupon.minOrder}`)
      return
    }

    setApplyingCoupon(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setAppliedCoupon({ code, ...coupon })
    localStorage.setItem('appliedCoupon', code)
    toast.success(`Coupon ${code} applied!`)
    setCouponCode('')
    setApplyingCoupon(false)
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    localStorage.removeItem('appliedCoupon')
    toast.info('Coupon removed')
  }

  // Calculate totals
  const subtotal = cart?.totalAmount || 0
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.type === 'percentage') {
      return Math.round(subtotal * (appliedCoupon.value / 100))
    }
    return appliedCoupon.value
  }
  const discount = calculateDiscount()
  const gstRate = 0.18
  const gstAmount = Math.round((subtotal - discount) * gstRate)
  const total = subtotal - discount + gstAmount

  const handleRemove = async (productId) => {
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId })
      })
      if (res.ok) {
        const data = await res.json()
        setCart(data.cart)
        toast.success('Removed from cart')
      }
    } catch (err) {
      toast.error('Failed to remove item')
    }
  }

  const handleCheckout = async () => {
    setCheckingOut(true)
    try {
      const token = await user.getIdToken()
      
      // Get user profile for email
      const userRes = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = await userRes.json()
      
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          amount: total,
          items: cart.items,
          subtotal,
          discount,
          gst: gstAmount,
          coupon: appliedCoupon?.code,
          userEmail: userData.profile?.email || user.email,
          userName: userData.profile?.displayName || user.displayName
        })
      })
      
      const { orderId, key, error } = await res.json()
      if (error) throw new Error(error)

      const options = {
        key: key || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_SY8Jo44VXe0UzH',
        amount: total * 100,
        currency: "INR",
        name: "KalaSarthi",
        description: "Artisan Marketplace Purchase",
        order_id: orderId,
        handler: async function (response) {
          // Verify payment (webhook will handle the rest)
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json', 
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })
            
            const result = await verifyRes.json()
            if (result.success) {
              setOrderComplete(true)
              toast.success('Payment Successful!')
              // Clear applied coupon from storage
              localStorage.removeItem('appliedCoupon')
              setAppliedCoupon(null)
            } else {
              toast.error('Payment Verification Failed')
            }
          } catch (e) {
            toast.error('Payment verification error')
            console.error(e)
          }
        },
        theme: { color: "#6B1F2B" } // Heritage maroon
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function(response) {
        toast.error('Payment failed: ' + response.error.description)
      })
      rzp.open()

    } catch (err) {
      console.error(err)
      toast.error('Failed to initiate checkout')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="text-center py-20 animate-fade-in max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold font-display text-foreground mb-4">Payment Successful!</h2>
        <p className="text-muted-foreground mb-8">Thank you for supporting Indian artisans. Your order has been placed and is being processed.</p>
        <Link href="/dashboard/orders">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white p-6 text-lg rounded-xl">
            View My Orders
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" /> 
          My Cart
          {cart?.items?.length > 0 && (
            <Badge variant="outline" className="bg-secondary/50 text-primary">
              {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'}
            </Badge>
          )}
        </h2>
      </div>

      {!cart || !cart.items || cart.items.length === 0 ? (
        <Card className="text-center py-20 border-primary/10 bg-gradient-to-b from-card to-secondary/20">
          <CardContent>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-10 w-10 text-primary/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Your cart is empty</h3>
            <p className="text-muted-foreground text-sm mt-2 mb-6 max-w-sm mx-auto">
              Explore our handcrafted collection and add unique artisan products to your cart.
            </p>
            <Link href="/dashboard/marketplace">
              <Button className="bg-primary hover:bg-primary/90">Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <Card key={item.productId} className="overflow-hidden border-primary/10">
                <div className="flex">
                  {/* Product Image */}
                  <div className="w-28 h-28 bg-secondary/50 flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="h-10 w-10 text-primary/30" />
                    )}
                  </div>
                  
                  {/* Product Details */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.artisanName || 'KalaSarthi Artisan'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-lg">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">₹{item.price.toLocaleString('en-IN')} each</p>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating[item.productId]}
                          className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary/10 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4 text-primary" />
                        </button>
                        
                        <span className="w-12 text-center font-semibold text-foreground">
                          {updating[item.productId] ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={updating[item.productId]}
                          className="w-8 h-8 rounded-lg bg-secondary hover:bg-primary/10 flex items-center justify-center transition-colors disabled:opacity-50"
                        >
                          <Plus className="h-4 w-4 text-primary" />
                        </button>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemove(item.productId)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remove
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
          
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-primary/10">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold font-display text-lg pb-3 border-b border-primary/10">
                  Order Summary
                </h3>
                
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>

                {/* GST */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GST (18%)</span>
                  <span className="font-medium">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* Coupon Section */}
                <div className="pt-2">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => {
                            setCouponCode(e.target.value.toUpperCase())
                            setCouponError('')
                          }}
                          className="flex-1 h-10 border-primary/20"
                          onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                        />
                        <Button
                          onClick={applyCoupon}
                          disabled={applyingCoupon || !couponCode.trim()}
                          variant="outline"
                          className="h-10 px-4 border-primary/20 hover:bg-primary/10"
                        >
                          {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <X className="h-3 w-3" /> {couponError}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Try: <span className="font-mono text-primary cursor-pointer hover:underline" onClick={() => setCouponCode('KALA10')}>KALA10</span>, 
                        {' '}<span className="font-mono text-primary cursor-pointer hover:underline" onClick={() => setCouponCode('BANK10')}>BANK10</span>, 
                        {' '}<span className="font-mono text-primary cursor-pointer hover:underline" onClick={() => setCouponCode('CRAFT500')}>CRAFT500</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-semibold text-green-800 text-sm">{appliedCoupon.code}</p>
                            <p className="text-xs text-green-600">
                              {appliedCoupon.type === 'percentage' 
                                ? `${appliedCoupon.value}% off` 
                                : `₹${appliedCoupon.value} off`}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={removeCoupon}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-green-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Discount Display */}
                {discount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-4 w-4" /> Discount
                    </span>
                    <span className="font-medium">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center border-t border-primary/10 pt-4">
                  <span className="font-bold text-foreground text-lg">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">₹{total.toLocaleString('en-IN')}</span>
                    {discount > 0 && (
                      <p className="text-xs text-green-600">You saved ₹{discount.toLocaleString('en-IN')} 🎉</p>
                    )}
                  </div>
                </div>

                {/* Checkout Button */}
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg py-6 text-lg transition-all hover:scale-[1.02]" 
                  onClick={handleCheckout} 
                  disabled={checkingOut}
                >
                  {checkingOut ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                  )}
                  Checkout Securely
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Secure payment powered by Razorpay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
