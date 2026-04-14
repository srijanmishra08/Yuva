import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const supabase = createAdminClient();

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      // Update delegate payment status if webhook comes before verify
      await supabase
        .from('delegates')
        .update({ payment_status: 'VERIFIED', payment_id: payment.id })
        .eq('razorpay_order_id', payment.order_id);

      await supabase
        .from('razorpay_orders')
        .update({
          status: 'paid',
          payment_id: payment.id,
          webhook_verified: true,
        })
        .eq('order_id', payment.order_id);
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      
      await supabase
        .from('delegates')
        .update({ payment_status: 'FAILED' })
        .eq('razorpay_order_id', payment.order_id);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
