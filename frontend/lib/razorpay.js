import Razorpay from 'razorpay'

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SY8Jo44VXe0UzH',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'ogHSxqKn1Lhu61S7cKATh7PL',
})
