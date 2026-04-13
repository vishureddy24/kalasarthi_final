import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"

export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    // Ensure invoices directory exists
    const invoicesDir = path.join(process.cwd(), "public/invoices")
    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true })
    }

    const fileName = `KalaSarthi_Invoice_${order.id.slice(-8)}.pdf`
    const filePath = path.join(invoicesDir, fileName)

    const doc = new PDFDocument({ margin: 50 })
    const stream = fs.createWriteStream(filePath)
    
    doc.pipe(stream)

    // Header with branding
    doc.fontSize(24).fillColor('#6B1F2B').text("KalaSarthi", 50, 50)
    doc.fontSize(12).fillColor('#666').text("Celebrating Indian Craftsmanship", 50, 80)
    doc.moveDown(2)

    // Invoice Title
    doc.fontSize(18).fillColor('#333').text("INVOICE", { align: 'center' })
    doc.moveDown(1)

    // Invoice Details
    doc.fontSize(10).fillColor('#333')
    doc.text(`Invoice Number: #${order.id.slice(-8)}`, 50, 150)
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 165)
    doc.text(`Order ID: ${order.id}`, 50, 180)
    
    if (order.razorpayOrderId) {
      doc.text(`Razorpay Order: ${order.razorpayOrderId}`, 50, 195)
    }
    if (order.razorpayPaymentId) {
      doc.text(`Payment ID: ${order.razorpayPaymentId}`, 50, 210)
    }

    // Customer Details
    doc.moveDown(2)
    doc.fontSize(12).fillColor('#6B1F2B').text("Bill To:", 50, doc.y)
    doc.fontSize(10).fillColor('#333')
    doc.text(order.userName || 'Customer', 50, doc.y + 5)
    doc.text(order.userEmail || 'N/A', 50, doc.y)

    // Items Table Header
    doc.moveDown(2)
    const tableTop = doc.y
    
    doc.fontSize(10).fillColor('#6B1F2B')
    doc.text("Item", 50, tableTop)
    doc.text("Qty", 300, tableTop)
    doc.text("Price", 350, tableTop)
    doc.text("Amount", 450, tableTop)
    
    // Line
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#6B1F2B')

    // Items
    doc.fontSize(10).fillColor('#333')
    let y = tableTop + 25
    
    order.items.forEach((item) => {
      const amount = item.price * item.quantity
      doc.text(item.title.slice(0, 35), 50, y)
      doc.text(item.quantity.toString(), 300, y)
      doc.text(`₹${item.price.toLocaleString('en-IN')}`, 350, y)
      doc.text(`₹${amount.toLocaleString('en-IN')}`, 450, y)
      y += 20
    })

    // Line
    doc.moveTo(50, y).lineTo(550, y).stroke('#ccc')
    y += 15

    // Totals
    doc.fontSize(10).fillColor('#333')
    doc.text("Subtotal:", 350, y)
    doc.text(`₹${(order.subtotal || order.total).toLocaleString('en-IN')}`, 450, y)
    y += 20

    if (order.discount > 0) {
      doc.fillColor('#16a34a')
      doc.text(`Discount (${order.coupon}):`, 350, y)
      doc.text(`-₹${order.discount.toLocaleString('en-IN')}`, 450, y)
      y += 20
    }

    doc.fillColor('#333')
    doc.text("Shipping:", 350, y)
    doc.text("Free", 450, y)
    y += 25

    // Total
    doc.fontSize(14).fillColor('#6B1F2B')
    doc.text("Total:", 350, y)
    doc.text(`₹${order.total.toLocaleString('en-IN')}`, 450, y)

    // Footer
    doc.moveDown(4)
    doc.fontSize(9).fillColor('#666')
    doc.text("Thank you for supporting Indian artisans! 🎨", { align: 'center' })
    doc.moveDown(0.5)
    doc.text("For any queries, contact support@kalasarthi.com", { align: 'center' })

    doc.end()

    stream.on("finish", () => resolve({ filePath, fileName }))
    stream.on("error", reject)
  })
}
