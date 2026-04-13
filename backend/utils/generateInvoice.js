'use client'

export async function generateInvoice(order) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()

  // Header styling
  doc.setFontSize(22)
  doc.setTextColor(249, 115, 22) // Primary Orange (#f97316)
  doc.text('KalaSarthi Invoice', 20, 25)

  // Subheader Line
  doc.setLineWidth(0.5)
  doc.setDrawColor(200, 200, 200)
  doc.line(20, 32, 190, 32)

  // Order Info
  doc.setFontSize(11)
  doc.setTextColor(80, 80, 80)
  doc.text(`Order ID: ${order.id || order.orderId}`, 20, 45)
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 52)
  doc.text(`Status: ${order.status?.toUpperCase()}`, 20, 59)

  // Items Header
  doc.setFontSize(14)
  doc.setTextColor(50, 50, 50)
  doc.text('Items Details', 20, 75)
  doc.line(20, 78, 190, 78)

  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text('Title & Quantity', 20, 85)
  doc.text('Price', 170, 85, { align: 'right' })

  let y = 95
  doc.setTextColor(60, 60, 60)

  // Table Body
  order.items.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.title}  x ${item.quantity}`, 20, y)
    doc.text(`Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}`, 170, y, { align: 'right' })
    y += 10
  })

  // Total amount line
  doc.line(20, y + 5, 190, y + 5)
  y += 15

  doc.setFontSize(14)
  doc.setTextColor(249, 115, 22)
  doc.text('Total Amount:', 130, y)
  doc.text(`Rs. ${order.totalAmount.toLocaleString('en-IN')}`, 170, y, { align: 'right' })

  // Footer message
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('Thank you for supporting Indian artisans!', 105, 280, { align: 'center' })

  // Trigger download
  doc.save(`invoice-${order.id || order.orderId}.pdf`)
}
