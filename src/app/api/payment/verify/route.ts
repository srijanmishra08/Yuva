import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { generateQRCodeDataURL } from '@/lib/qrcode';
import { sendRegistrationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json();

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get order data
    const { data: order } = await supabase
      .from('razorpay_orders')
      .select('*')
      .eq('order_id', razorpay_order_id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate delegate ID
    const { data: idData } = await supabase
      .rpc('generate_delegate_id');
    
    const delegateId = idData as string;

    // Generate QR code
    const { dataUrl: qrDataUrl, token: qrToken } = await generateQRCodeDataURL(delegateId);

    const formData = order.delegate_temp_data as Record<string, unknown>;

    // Create delegate record
    const { data: delegate, error: insertErr } = await supabase
      .from('delegates')
      .insert({
        delegate_id: delegateId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        class_year: formData.class_year,
        institution: formData.institution,
        address: formData.address,
        pin_code: formData.pin_code,
        city: formData.city,
        parent_name: formData.parent_name,
        parent_contact: formData.parent_contact,
        instagram_handle: formData.instagram_handle || null,
        pref1: formData.pref1,
        portfolio_pref1: formData.portfolio_pref1 || null,
        pref2: formData.pref2,
        experience: formData.experience || null,
        carnival_pass: formData.carnival_pass || false,
        referred_by: formData.referred_by || null,
        payment_type: 'RAZORPAY',
        payment_status: 'VERIFIED',
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        amount_paid: formData.amount,
        qr_code_url: qrDataUrl,
        qr_token: qrToken,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Delegate insert error:', insertErr);
      return NextResponse.json({ error: 'Failed to create delegate record' }, { status: 500 });
    }

    // Update order status
    await supabase
      .from('razorpay_orders')
      .update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        webhook_verified: true,
      })
      .eq('order_id', razorpay_order_id);

    // Send confirmation email (non-blocking)
    sendRegistrationEmail(delegate).catch(console.error);

    return NextResponse.json({
      success: true,
      delegate_id: delegateId,
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
