import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const mailOptions = {
      from: `"KalaSarthi" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }
    
    if (attachments.length > 0) {
      mailOptions.attachments = attachments
    }
    
    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to}`)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

export const sendOrderConfirmationEmailWithInvoice = async (order, userEmail, userName, invoicePath) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('')

  const discountHtml = order.discount > 0 ? `
    <tr>
      <td colspan="2" style="padding: 10px; text-align: right; color: #16a34a;">Discount (${order.coupon})</td>
      <td style="padding: 10px; text-align: right; color: #16a34a;">-₹${order.discount.toLocaleString('en-IN')}</td>
    </tr>
  ` : ''

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B1F2B; margin: 0;">KalaSarthi</h1>
        <p style="color: #666; margin: 5px 0;">Celebrating Indian Craftsmanship</p>
      </div>

      <div style="background: #F5E8D8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #6B1F2B; margin: 0 0 10px 0;">🎉 Order Confirmed!</h2>
        <p style="margin: 0; color: #333;">Hi ${userName},</p>
        <p style="margin: 10px 0 0 0; color: #555;">Thank you for supporting Indian artisans. Your order has been successfully placed!</p>
      </div>

      <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
        <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${order.id}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Payment ID:</strong> ${order.paymentId || 'N/A'}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
      </div>

      <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Items Ordered</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8f8f8;">
              <th style="padding: 10px; text-align: left;">Product</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Subtotal</strong></td>
              <td style="padding: 10px; text-align: right; border-top: 2px solid #eee;">₹${(order.subtotal || order.total).toLocaleString('en-IN')}</td>
            </tr>
            ${discountHtml}
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right; font-size: 18px;"><strong>Total Paid</strong></td>
              <td style="padding: 10px; text-align: right; font-size: 18px; color: #6B1F2B;"><strong>₹${(order.total || order.totalAmount).toLocaleString('en-IN')}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #555;">
          <li>Your order will be processed within 24 hours</li>
          <li>You'll receive tracking information once shipped</li>
          <li>Estimated delivery: 3-5 business days</li>
        </ul>
      </div>

      <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; color: #2e7d32;">📎 Your invoice is attached to this email.</p>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid #eee;">
        <p style="color: #666; margin: 0;">Thank you for supporting Indian artisans! 🙏</p>
        <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">
          Questions? Reply to this email or contact us at support@kalasarthi.com
        </p>
      </div>
    </div>
  `

  const attachments = invoicePath ? [{
    filename: `KalaSarthi_Invoice_${order.id.slice(-8)}.pdf`,
    path: invoicePath
  }] : []

  return sendEmail(userEmail, `Order Confirmed - #${order.id.slice(-8)}`, html, attachments)
}

export const sendOrderConfirmationEmail = async (order, userEmail, userName) => {
  // Version without invoice (fallback)
  return sendOrderConfirmationEmailWithInvoice(order, userEmail, userName, null)
}

export const sendOrderNotificationToArtisan = async (item, artisanEmail, artisanName, orderDetails) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6B1F2B; margin: 0;">KalaSarthi</h1>
        <p style="color: #666; margin: 5px 0;">Artist Dashboard</p>
      </div>

      <div style="background: #F5E8D8; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #6B1F2B; margin: 0 0 10px 0;">🛍️ New Order Received!</h2>
        <p style="margin: 0; color: #333;">Hi ${artisanName},</p>
        <p style="margin: 10px 0 0 0; color: #555;">Great news! Someone just purchased your handcrafted product.</p>
      </div>

      <div style="border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Product Details</h3>
        <p style="margin: 5px 0; color: #666;"><strong>Product:</strong> ${item.title}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Quantity:</strong> ${item.quantity}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Amount:</strong> ₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
        <p style="margin: 5px 0; color: #666;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
      </div>

      <div style="background: #f8f8f8; padding: 20px; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Next Steps</h3>
        <ol style="margin: 0; padding-left: 20px; color: #555;">
          <li>Prepare the product for shipping</li>
          <li>Pack it securely with care</li>
          <li>Update tracking information in your dashboard</li>
          <li>Ship within 2 business days</li>
        </ol>
      </div>

      <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; margin-top: 20px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/orders" 
           style="background: #6B1F2B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          View Order Details
        </a>
      </div>

      <div style="text-align: center; padding: 20px;">
        <p style="color: #666; margin: 0;">Keep creating amazing crafts! 🎨</p>
      </div>
    </div>
  `

  return sendEmail(artisanEmail, `New Order: ${item.title}`, html)
}
