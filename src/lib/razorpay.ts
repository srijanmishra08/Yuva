import Razorpay from 'razorpay';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Create Razorpay order
 */
export async function createRazorpayOrder(amount: number, receiptId: string) {
  const order = await razorpay.orders.create({
    amount: amount * 100, // convert to paise
    currency: 'INR',
    receipt: receiptId,
    notes: {
      portal: 'YUVA Conference Portal',
      event: 'YDS 2026',
    },
  });
  return order;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(rawBody)
    .digest('hex');
  
  return expectedSignature === signature;
}

/**
 * Verify Razorpay payment signature (client-side verification)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  
  return expectedSignature === signature;
}
