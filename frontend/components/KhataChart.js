'use client'

import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

const KhataChart = memo(function KhataChart({ data, totalIncome = 0, totalExpense = 0 }) {
  const profit = totalIncome - totalExpense
  
  if (!data || data.length === 0) {
    return (
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Khata Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No transactions yet. Add income or expenses to see your financial overview.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Khata Overview
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-green-600 font-medium">Income: ₹{totalIncome.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span className="text-red-600 font-medium">Expense: ₹{totalExpense.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        <div className={`
          mt-2 text-sm font-medium inline-flex items-center gap-1 px-3 py-1 rounded-full w-fit
          ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}>
          {profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          Profit: ₹{profit.toLocaleString('en-IN')}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value, name) => [`₹${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expense']}
            />
            <Legend />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
})

export default KhataChart
