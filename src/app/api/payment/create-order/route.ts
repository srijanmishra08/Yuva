import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createRazorpayOrder } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { carnival_pass, email, first_name, last_name, ...rest } = body;

    // Calculate amount
    const amount = carnival_pass ? 698 : 499;

    // Check if email already registered
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from('delegates')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(amount, `YDS26-${Date.now()}`);

    // Store temp order data in DB
    await supabase.from('razorpay_orders').insert({
      order_id: order.id,
      delegate_temp_data: {
        first_name,
        last_name,
        email,
        carnival_pass,
        amount,
        ...rest,
      },
      amount: amount * 100,
      status: 'created',
    });

    return NextResponse.json({ orderId: order.id, amount: amount * 100 });
  } catch (err) {
    console.error('Create order error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
