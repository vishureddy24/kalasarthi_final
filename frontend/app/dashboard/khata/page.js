'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { exportCSV } from '@/utils/exportCSV'
import { exportPDF } from '@/utils/exportPDF'
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  Tag,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

// Lazy load chart component
const KhataChart = dynamic(() => import('@/components/KhataChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-amber-600 border-t-transparent rounded-full"/></div>
})

export default function KhataPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  const fetchData = async () => {
    if (!user) return
    try {
      const token = await user.getIdToken()
      
      // Fetch transactions
      const txRes = await fetch(`/api/transactions?artisanId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (txRes.ok) {
        const txData = await txRes.json()
        setTransactions(txData.transactions || [])
      }
      
      // Fetch chart data
      const chartRes = await fetch(`/api/transactions/chart?artisanId=${user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (chartRes.ok) {
        const chartData = await chartRes.json()
        setChartData(chartData.chartData || [])
      }
    } catch (err) {
      console.error('Failed to fetch khata data:', err)
      toast.error('Failed to load khata data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          artisanId: user.uid
        })
      })
      
      if (res.ok) {
        toast.success(`${formData.type === 'income' ? 'Income' : 'Expense'} added successfully`)
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        setShowAddForm(false)
        fetchData()
      } else {
        toast.error('Failed to add transaction')
      }
    } catch (err) {
      console.error('Error adding transaction:', err)
      toast.error('Failed to add transaction')
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const profit = totalIncome - totalExpense

  const categories = {
    income: ['Product Sales', 'Order Payment', 'Other Income'],
    expense: ['Raw Materials', 'Tools', 'Transport', 'Packaging', 'Other']
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Digital Khata</h1>
          <p className="text-muted-foreground">Track your income and expenses</p>
        </div>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportCSV(transactions, `khata-${new Date().toISOString().split('T')[0]}.csv`)}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => exportPDF(transactions, `khata-${new Date().toISOString().split('T')[0]}.pdf`)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            </>
          )}
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <ArrowDownLeft className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₹{totalExpense.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${profit >= 0 ? 'border-green-100' : 'border-red-100'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{profit.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Wallet className={`h-6 w-6 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <KhataChart 
        data={chartData} 
        totalIncome={totalIncome} 
        totalExpense={totalExpense} 
      />

      {/* Add Transaction Form */}
      {showAddForm && (
        <Card className="border-amber-100">
          <CardHeader>
            <CardTitle>Add Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                    required
                  >
                    <option value="">Select category</option>
                    {categories[formData.type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Add Transaction</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      <Card className="border-amber-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Add your first transaction to start tracking</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      t.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {t.type === 'income' ? (
                        <TrendingUp className={`h-5 w-5 text-green-600`} />
                      ) : (
                        <TrendingDown className={`h-5 w-5 text-red-600`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{t.category}</p>
                      <p className="text-sm text-muted-foreground">{t.description || 'No description'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.date || t.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      t.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                    </p>
                    <Badge variant="outline" className={
                      t.type === 'income' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'
                    }>
                      {t.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
