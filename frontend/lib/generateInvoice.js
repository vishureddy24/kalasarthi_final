import { jsPDF } from "jspdf"

export const generateInvoicePDF = (order) => {
  const doc = new jsPDF()
  
  // Primary color - dark red
  const primaryColor = [107, 31, 43]
  const grayColor = [102, 102, 102]
  const lightGray = [243, 244, 246]
  
  // Header - Company Name
  doc.setFontSize(24)
  doc.setTextColor(...primaryColor)
  doc.text("KalaSarthi", 14, 20)
  
  doc.setFontSize(11)
  doc.setTextColor(...grayColor)
  doc.text("Celebrating Indian Craftsmanship", 14, 28)
  
  // Invoice Title
  doc.setFontSize(18)
  doc.setTextColor(51, 51, 51)
  doc.text("TAX INVOICE", 150, 20, { align: 'right' })
  
  // Invoice Details Box
  const invoiceDetails = [
    [`Invoice No:`, `#${order.id.slice(-8)}`],
    [`Date:`, new Date(order.createdAt).toLocaleDateString('en-IN')],
    [`Order ID:`, order.id],
    [`Payment ID:`, order.razorpayPaymentId || 'N/A']
  ]
  
  let yPos = 45
  doc.setFontSize(10)
  invoiceDetails.forEach(([label, value]) => {
    doc.setTextColor(...grayColor)
    doc.text(label, 120, yPos)
    doc.setTextColor(0, 0, 0)
    doc.text(value, 160, yPos)
    yPos += 6
  })
  
  // Horizontal line
  doc.setDrawColor(...primaryColor)
  doc.line(14, 65, 196, 65)
  
  // Bill To Section
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.text("Bill To:", 14, 75)
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(order.userName || 'Customer', 14, 82)
  doc.text(order.userEmail || 'N/A', 14, 89)
  doc.text(order.userPhone || '', 14, 96)
  
  // Ship To Section
  doc.setTextColor(...primaryColor)
  doc.text("Ship To:", 100, 75)
  doc.setTextColor(0, 0, 0)
  doc.text(order.shippingAddress?.fullName || order.userName || 'Customer', 100, 82)
  doc.text(order.shippingAddress?.address || '', 100, 89)
  doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`, 100, 96)
  
  // Horizontal line
  doc.line(14, 105, 196, 105)
  
  // Items Table Header
  let tableY = 112
  doc.setFillColor(...primaryColor)
  doc.rect(14, tableY - 5, 182, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont(undefined, 'bold')
  doc.text("Item Description", 16, tableY)
  doc.text("Qty", 110, tableY)
  doc.text("Price", 135, tableY)
  doc.text("Amount", 170, tableY)
  doc.setFont(undefined, 'normal')
  
  // Items Table Rows
  tableY += 10
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  
  order.items.forEach((item, index) => {
    const amount = item.price * item.quantity
    
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250)
      doc.rect(14, tableY - 4, 182, 6, 'F')
    }
    
    doc.text(item.title.substring(0, 40), 16, tableY)
    doc.text(item.quantity.toString(), 112, tableY)
    doc.text(`₹${item.price.toLocaleString('en-IN')}`, 135, tableY)
    doc.text(`₹${amount.toLocaleString('en-IN')}`, 170, tableY)
    
    tableY += 7
  })
  
  // Horizontal line after items
  doc.setDrawColor(200, 200, 200)
  doc.line(14, tableY + 2, 196, tableY + 2)
  
  // Totals Section
  let totalsY = tableY + 10
  
  // Calculate display values from order or fallback
  const displaySubtotal = order.subtotal || (order.total * 0.82)  // Approximate if not stored
  const displayDiscount = order.discount || 0
  const displayTaxable = order.taxableAmount || (displaySubtotal - displayDiscount)
  const displayCgst = order.cgst || Math.round(displayTaxable * 0.09)
  const displaySgst = order.sgst || Math.round(displayTaxable * 0.09)
  const displayTotal = order.total
  
  doc.setFontSize(10)
  doc.setTextColor(...grayColor)
  doc.text("Subtotal:", 140, totalsY)
  doc.setTextColor(0, 0, 0)
  doc.text(`₹${displaySubtotal.toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
  
  if (displayDiscount > 0) {
    totalsY += 7
    doc.setTextColor(22, 163, 74)
    doc.text(`Discount ${order.coupon ? '(' + order.coupon + ')' : ''}:`, 140, totalsY)
    doc.text(`-₹${displayDiscount.toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
    doc.setTextColor(...grayColor)
  }
  
  // Taxable Amount
  totalsY += 7
  doc.text("Taxable Amount:", 140, totalsY)
  doc.setTextColor(0, 0, 0)
  doc.text(`₹${displayTaxable.toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
  
  totalsY += 7
  doc.text("Shipping:", 140, totalsY)
  doc.setTextColor(0, 0, 0)
  doc.text("Free", 180, totalsY, { align: 'right' })
  
  // Tax Details - Use stored values
  totalsY += 7
  doc.setTextColor(...grayColor)
  doc.text("CGST (9%):", 140, totalsY)
  doc.text(`₹${displayCgst.toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
  
  totalsY += 7
  doc.text("SGST (9%):", 140, totalsY)
  doc.text(`₹${displaySgst.toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
  
  // Total GST
  totalsY += 7
  doc.text("Total GST (18%):", 140, totalsY)
  doc.text(`₹${(displayCgst + displaySgst).toLocaleString('en-IN')}`, 180, totalsY, { align: 'right' })
  
  // Total with background
  totalsY += 10
  doc.setFillColor(...lightGray)
  doc.rect(130, totalsY - 4, 66, 10, 'F')
  
  doc.setFontSize(12)
  doc.setTextColor(...primaryColor)
  doc.setFont(undefined, 'bold')
  doc.text("Total:", 140, totalsY + 2)
  doc.text(`₹${displayTotal.toLocaleString('en-IN')}`, 180, totalsY + 2, { align: 'right' })
  doc.setFont(undefined, 'normal')
  
  // Terms and Conditions
  const termsY = totalsY + 20
  doc.setFontSize(9)
  doc.setTextColor(...grayColor)
  doc.text("Terms & Conditions:", 14, termsY)
  doc.setFontSize(8)
  doc.text("1. All items are handcrafted by Indian artisans", 14, termsY + 5)
  doc.text("2. Returns accepted within 7 days of delivery", 14, termsY + 10)
  doc.text("3. GST Number: 29AABCU9603R1ZX", 14, termsY + 15)
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(...primaryColor)
  doc.text("Thank you for supporting Indian artisans!", 105, 285, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text("For queries: support@kalasarthi.com | www.kalasarthi.com", 105, 290, { align: 'center' })
  
  // Return as ArrayBuffer for API use
  const pdfArrayBuffer = doc.output('arraybuffer')
  const fileName = `KalaSarthi_Invoice_${order.id.slice(-8)}.pdf`
  
  return { buffer: Buffer.from(pdfArrayBuffer), fileName }
}
