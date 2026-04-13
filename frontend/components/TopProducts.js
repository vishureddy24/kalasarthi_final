'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Package, Award } from 'lucide-react'

const TopProducts = memo(function TopProducts({ products }) {
  if (!products || products.length === 0) {
    return (
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-amber-600" />
            Top Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No sales data yet. Start selling to see your top products!
          </div>
        </CardContent>
      </Card>
    )
  }

  // Sort by quantity sold (descending)
  const sortedProducts = [...products]
    .sort((a, b) => (b.quantitySold || 0) - (a.quantitySold || 0))
    .slice(0, 5)

  const maxSales = sortedProducts[0]?.quantitySold || 1

  return (
    <Card className="border-amber-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-amber-600" />
          Top Products
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedProducts.map((product, index) => {
          const percentage = ((product.quantitySold || 0) / maxSales) * 100
          
          return (
            <div key={product.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                    ${index === 0 ? 'bg-amber-100 text-amber-700' : ''}
                    ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                    ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                    ${index > 2 ? 'bg-slate-100 text-slate-600' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{product.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.quantitySold || 0} sold • ₹{(product.revenue || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                {index === 0 && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Best Seller
                  </Badge>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    index === 0 ? 'bg-amber-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-400' : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
})

export default TopProducts
