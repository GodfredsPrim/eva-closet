import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendOrderNotification(order: any) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
    subject: 'New Order Received',
    text: `A new order has been placed.

Customer: ${order.customerName}
Phone: ${order.customerPhone}
Address: ${order.customerAddress}
Total: ₵${order.total.toFixed(2)}
Status: ${order.status}

Items:
${order.orderItems
      .map(
        (item: any) => `- ${item.product.name} x${item.quantity} @ ₵${item.price.toFixed(2)}`
      )
      .join('\n')}
`,
  }

  await transporter.sendMail(mailOptions)
}
