export async function exportPDF(data, filename = 'khata.pdf') {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text('KalaSarthi - Digital Khata', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, 30)
  
  // Summary
  const totalIncome = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const profit = totalIncome - totalExpense
  
  doc.setFontSize(14)
  doc.text('Financial Summary', 20, 45)
  
  doc.setFontSize(11)
  doc.text(`Total Income: ₹${totalIncome.toLocaleString('en-IN')}`, 20, 55)
  doc.text(`Total Expense: ₹${totalExpense.toLocaleString('en-IN')}`, 20, 62)
  doc.text(`Net Profit: ₹${profit.toLocaleString('en-IN')}`, 20, 69)
  
  // Transactions table
  doc.setFontSize(14)
  doc.text('Transaction History', 20, 85)
  
  let y = 95
  let runningBalance = 0
  
  // Table headers
  doc.setFontSize(10)
  doc.setFillColor(245, 158, 11)
  doc.rect(20, y - 5, 170, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('Date', 22, y)
  doc.text('Type', 50, y)
  doc.text('Category', 75, y)
  doc.text('Amount', 120, y)
  doc.text('Balance', 150, y)
  
  y += 10
  doc.setTextColor(0, 0, 0)
  
  data.forEach((t, i) => {
    if (t.type === 'income') {
      runningBalance += t.amount
    } else {
      runningBalance -= t.amount
    }
    
    if (y > 270) {
      doc.addPage()
      y = 20
    }
    
    // Alternate row colors
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250)
      doc.rect(20, y - 5, 170, 7, 'F')
    }
    
    doc.text(new Date(t.date || t.createdAt).toLocaleDateString('en-IN'), 22, y)
    doc.text(t.type.charAt(0).toUpperCase() + t.type.slice(1), 50, y)
    doc.text(t.category, 75, y)
    doc.text(`₹${t.amount.toLocaleString('en-IN')}`, 120, y)
    doc.text(`₹${runningBalance.toLocaleString('en-IN')}`, 150, y)
    
    y += 8
  })
  
  doc.save(filename)
}
