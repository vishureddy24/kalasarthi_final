export function exportCSV(data, filename = 'khata.csv') {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance']
  
  let runningBalance = 0
  const rows = data.map(t => {
    if (t.type === 'income') {
      runningBalance += t.amount
    } else {
      runningBalance -= t.amount
    }
    
    return [
      new Date(t.date || t.createdAt).toLocaleDateString('en-IN'),
      t.type,
      t.category,
      t.description || '',
      t.amount,
      runningBalance
    ]
  })
  
  // Add summary row
  const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  
  rows.push([])
  rows.push(['', '', '', 'TOTAL INCOME', totalIncome, ''])
  rows.push(['', '', '', 'TOTAL EXPENSE', totalExpense, ''])
  rows.push(['', '', '', 'NET PROFIT', profit, ''])
  
  const csv = [headers, ...rows].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
