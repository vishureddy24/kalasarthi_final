import nodemailer from 'nodemailer'

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  })
}

/**
 * Send invoice email to buyer with PDF attachment
 * @param {Object} order - Order details
 * @param {Buffer} pdfBuffer - PDF invoice buffer
 * @param {string} fileName - PDF filename
 */
export async function sendInvoiceEmail(order, pdfBuffer, fileName) {
  try {
    const transporter = createTransporter()
    
    const buyerEmail = order.buyerEmail || order.userEmail
    const buyerName = order.buyerName || order.userName || 'Customer'
    const invoiceNumber = order.invoiceNumber || `INV-KS-${Date.now().toString().slice(-8)}`
    const totalAmount = order.totalAmount || order.total || 0
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B1F2B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #6B1F2B; }
          .amount { font-size: 24px; color: #6B1F2B; font-weight: bold; }
          .button { 
            display: inline-block; 
            background: #6B1F2B; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KalaSarthi</h1>
            <p>Celebrating Indian Craftsmanship</p>
          </div>
          
          <div class="content">
            <h2>Your GST Invoice is Ready!</h2>
            <p>Hi ${buyerName},</p>
            <p>Thank you for your purchase. Please find your GST-compliant invoice attached to this email.</p>
            
            <div class="details">
              <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
              <p><strong>Order ID:</strong> ${order.id || order.orderId}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
              <p class="amount">Total Amount: ₹${totalAmount.toLocaleString('en-IN')}</p>
            </div>
            
            <p>Your order is being processed and will be shipped soon. You can track your order status in your account.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders" class="button">View Order Details</a>
          </div>
          
          <div class="footer">
            <p>Need help? Contact us at support@kalasarthi.com</p>
            <p>© ${new Date().getFullYear()} KalaSarthi. All rights reserved.</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const mailOptions = {
      from: `"KalaSarthi" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `Your KalaSarthi Invoice - ${invoiceNumber}`,
      html: emailHtml,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Invoice email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('Failed to send invoice email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order confirmation email (without invoice)
 * @param {Object} order - Order details
 */
export async function sendOrderConfirmationEmail(order) {
  try {
    const transporter = createTransporter()
    
    const buyerEmail = order.buyerEmail || order.userEmail
    const buyerName = order.buyerName || order.userName || 'Customer'
    
    const itemsList = (order.items || [])
      .map(item => `<li>${item.name || item.title} x ${item.quantity} - ₹${item.price}</li>`)
      .join('')
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B1F2B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .order-details { background: white; padding: 15px; margin: 15px 0; }
          ul { list-style: none; padding: 0; }
          li { padding: 10px 0; border-bottom: 1px solid #eee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KalaSarthi</h1>
            <p>Order Confirmation</p>
          </div>
          
          <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Hi ${buyerName},</p>
            <p>We've received your order and it's being processed. You'll receive your invoice once the payment is confirmed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${order.id || order.orderId}</p>
              <ul>${itemsList}</ul>
              <p><strong>Total:</strong> ₹${(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} KalaSarthi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const mailOptions = {
      from: `"KalaSarthi" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: `Order Confirmation - ${order.id || order.orderId}`,
      html: emailHtml
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Order confirmation email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('Failed to send order confirmation:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send order notification to artisan
 * @param {Object} item - Order item details
 * @param {string} artisanEmail - Artisan email
 * @param {string} artisanName - Artisan name
 * @param {Object} orderDetails - Order details
 */
export async function sendOrderNotificationToArtisan(item, artisanEmail, artisanName, orderDetails) {
  try {
    const transporter = createTransporter()
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B1F2B; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          .product { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #6B1F2B; }
          .amount { font-size: 20px; color: #6B1F2B; font-weight: bold; }
          .button { 
            display: inline-block; 
            background: #6B1F2B; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>KalaSarthi</h1>
            <p>New Order Received!</p>
          </div>
          
          <div class="content">
            <h2>Hi ${artisanName},</h2>
            <p>You have received a new order for your product!</p>
            
            <div class="product">
              <h3>${item.name || item.title}</h3>
              <p><strong>Quantity:</strong> ${item.quantity || 1}</p>
              <p><strong>Price:</strong> ₹${(item.price || 0).toLocaleString('en-IN')}</p>
              <p class="amount">Total: ₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</p>
            </div>
            
            <p><strong>Order ID:</strong> ${orderDetails?.orderId || 'N/A'}</p>
            <p>Please prepare this item for shipping. You'll receive shipping details soon.</p>
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders" class="button">View Orders</a>
          </div>
          
          <div class="footer">
            <p>Keep creating amazing crafts!</p>
            <p>© ${new Date().getFullYear()} KalaSarthi. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const mailOptions = {
      from: `"KalaSarthi" <${process.env.EMAIL_USER}>`,
      to: artisanEmail,
      subject: `New Order Received - ${item.name || item.title}`,
      html: emailHtml
    }
    
    const result = await transporter.sendMail(mailOptions)
    console.log('Artisan notification sent:', result.messageId)
    return { success: true, messageId: result.messageId }
    
  } catch (error) {
    console.error('Failed to send artisan notification:', error)
    return { success: false, error: error.message }
  }
}

export default { sendInvoiceEmail, sendOrderConfirmationEmail, sendOrderNotificationToArtisan }
