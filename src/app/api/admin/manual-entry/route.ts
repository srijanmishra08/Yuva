import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';
import { generateQRCodeDataURL } from '@/lib/qrcode';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const body = await req.json();
  const { first_name, last_name, email, phone, class_year, institution, experience, pref1, payment_type } = body;

  if (!first_name || !last_name || !email || !phone || !class_year || !institution || !payment_type) {
    return apiError('Missing required fields');
  }

  const supabase = createAdminClient();

  // Check duplicate email
  const { data: existing } = await supabase
    .from('delegates')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) return apiError('Email already registered');

  // Generate delegate ID
  const { data: delegateId } = await supabase.rpc('generate_delegate_id');
  const { dataUrl: qrDataUrl, token: qrToken } = await generateQRCodeDataURL(delegateId as string);

  const { data: delegate, error } = await supabase
    .from('delegates')
    .insert({
      delegate_id: delegateId,
      first_name,
      last_name,
      email,
      phone,
      class_year,
      institution,
      experience: experience || null,
      pref1: pref1 || null,
      payment_type,
      payment_status: payment_type === 'RAZORPAY' ? 'PENDING' : 'VERIFIED',
      amount_paid: payment_type === 'COMPLIMENTARY' ? 0 : 499,
      qr_code_url: qrDataUrl,
      qr_token: qrToken,
    })
    .select('id, delegate_id')
    .single();

  if (error) {
    console.error(error);
    return apiError('Failed to create delegate');
  }

  await logAudit({
    action: 'MANUAL_DELEGATE_CREATED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: delegate.id,
    details: { payment_type, delegate_id: delegate.delegate_id },
  });

  return apiSuccess({ success: true, delegate_id: delegate.delegate_id });
}
