'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TicketPercent, Copy, CheckCircle, Sparkles, Banknote } from 'lucide-react'

const AVAILABLE_COUPONS = [
  {
    code: 'KALA10',
    title: 'Welcome Offer',
    description: 'Get 10% off on your first order',
    discount: 10,
    type: 'percentage',
    minOrder: 500,
    icon: Sparkles
  },
  {
    code: 'BANK10',
    title: 'Bank Offer',
    description: '10% off with any bank card',
    discount: 10,
    type: 'percentage',
    minOrder: 1000,
    icon: Banknote
  },
  {
    code: 'CRAFT500',
    title: 'Craft Lover',
    description: 'Flat ₹500 off on orders above ₹3000',
    discount: 500,
    type: 'flat',
    minOrder: 3000,
    icon: TicketPercent
  }
]

export default function CouponsPage() {
  const { user } = useAuth()
  const [appliedCode, setAppliedCode] = useState('')
  const [copiedCode, setCopiedCode] = useState(null)

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const applyCoupon = (code) => {
    setAppliedCode(code)
    // Store in localStorage for cart usage
    localStorage.setItem('appliedCoupon', code)
    // Show toast notification
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display text-foreground">My Coupons</h2>
        <Badge variant="outline" className="bg-secondary/50 text-primary">
          {AVAILABLE_COUPONS.length} Available
        </Badge>
      </div>

      {/* Hero Banner */}
      <Card className="border-primary/10 bg-gradient-to-r from-primary/10 to-secondary/30 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <TicketPercent className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Save More on Handcrafted Items</h3>
              <p className="text-sm text-muted-foreground">Apply coupons at checkout for instant discounts</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Coupon Display */}
      {appliedCode && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Coupon Applied!</p>
                <p className="text-sm text-green-600">Code: {appliedCode}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-700 hover:bg-green-100"
              onClick={() => {
                setAppliedCode('')
                localStorage.removeItem('appliedCoupon')
              }}
            >
              Remove
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Coupons Grid */}
      <div className="grid gap-4">
        {AVAILABLE_COUPONS.map((coupon) => {
          const Icon = coupon.icon
          const isApplied = appliedCode === coupon.code
          
          return (
            <Card 
              key={coupon.code} 
              className={`overflow-hidden border-primary/10 transition-all ${isApplied ? 'ring-2 ring-primary ring-offset-2' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">{coupon.title}</h3>
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        {coupon.type === 'percentage' ? `${coupon.discount}% OFF` : `₹${coupon.discount} OFF`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Min. order: ₹{coupon.minOrder}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border border-primary/10">
                      <span className="font-mono font-semibold text-primary">{coupon.code}</span>
                      <button
                        onClick={() => copyToClipboard(coupon.code)}
                        className="p-1 hover:bg-primary/10 rounded transition-colors"
                      >
                        {copiedCode === coupon.code ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>
                    <Button
                      size="sm"
                      className={isApplied ? 'bg-green-600 hover:bg-green-700' : 'bg-primary hover:bg-primary/90'}
                      onClick={() => applyCoupon(coupon.code)}
                      disabled={isApplied}
                    >
                      {isApplied ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* How to Use */}
      <Card className="border-primary/10 bg-secondary/20">
        <CardContent className="p-5">
          <h3 className="font-semibold text-foreground mb-3">How to use coupons</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Copy the coupon code by clicking the copy icon</li>
            <li>Add products to your cart from the marketplace</li>
            <li>At checkout, paste the coupon code in the "Apply Coupon" section</li>
            <li>The discount will be automatically applied to your order</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
