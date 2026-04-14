import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';
import { generateQRCodeDataURL } from '@/lib/qrcode';

interface CSVRow {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  institution: string;
  class_year: string;
  experience?: string;
  pref1?: string;
  pref2?: string;
  payment_type?: string;
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') {
    return apiError('Super Admin access required', 403);
  }

  const { rows } = await req.json() as { rows: CSVRow[] };
  if (!rows || !Array.isArray(rows)) return apiError('Invalid data');

  const supabase = createAdminClient();
  let successCount = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.first_name || !row.last_name || !row.email || !row.phone) {
      errors.push(`Row skipped: missing required fields for ${row.email || 'unknown'}`);
      continue;
    }

    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from('delegates')
        .select('id')
        .eq('email', row.email)
        .single();

      if (existing) {
        errors.push(`Skipped: ${row.email} already registered`);
        continue;
      }

      const { data: delegateId } = await supabase.rpc('generate_delegate_id');
      const { dataUrl: qrDataUrl, token: qrToken } = await generateQRCodeDataURL(delegateId as string);

      const paymentType = ['RAZORPAY', 'CASH', 'COMPLIMENTARY'].includes((row.payment_type || '').toUpperCase())
        ? (row.payment_type!.toUpperCase())
        : 'COMPLIMENTARY';

      await supabase.from('delegates').insert({
        delegate_id: delegateId,
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: row.email.trim().toLowerCase(),
        phone: row.phone.trim(),
        class_year: row.class_year?.trim() || 'N/A',
        institution: row.institution?.trim() || 'N/A',
        experience: row.experience?.trim() || null,
        pref1: row.pref1?.trim() || null,
        pref2: row.pref2?.trim() || null,
        payment_type: paymentType,
        payment_status: 'VERIFIED',
        amount_paid: paymentType === 'COMPLIMENTARY' ? 0 : 499,
        qr_code_url: qrDataUrl,
        qr_token: qrToken,
      });

      successCount++;
    } catch (err) {
      errors.push(`Error processing ${row.email}: ${String(err)}`);
    }
  }

  await logAudit({
    action: 'CSV_IMPORT',
    actorId: auth.userId!,
    actorRole: auth.role!,
    details: { total: rows.length, success: successCount, errors: errors.length },
  });

  return apiSuccess({ success: successCount, errors, total: rows.length });
}
