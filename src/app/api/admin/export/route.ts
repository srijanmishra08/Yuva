import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') {
    return apiError('Super Admin access required', 403);
  }

  const supabase = createAdminClient();
  const { data: delegates } = await supabase
    .from('delegates')
    .select(`
      delegate_id, first_name, last_name, email, phone,
      class_year, institution, city, address,
      parent_name, parent_contact, instagram_handle,
      pref1, pref2, experience, payment_type, payment_status,
      payment_id, amount_paid, carnival_pass, referred_by,
      allotment_status, checked_in, checkin_time, created_at,
      committees:committee_assigned(name, abbreviation),
      portfolios:portfolio_assigned(country_or_role)
    `)
    .order('created_at', { ascending: true });

  if (!delegates) return apiError('No data found', 404);

  // Build CSV
  const headers = [
    'Delegate ID', 'First Name', 'Last Name', 'Email', 'Phone',
    'Class/Year', 'Institution', 'City', 'Parent Name', 'Parent Contact',
    'Instagram', 'Pref 1', 'Pref 2', 'Experience',
    'Payment Type', 'Payment Status', 'Payment ID', 'Amount Paid',
    'Carnival Pass', 'Referred By', 'Committee', 'Portfolio',
    'Allotment Status', 'Checked In', 'Check-in Time', 'Registered At'
  ];

  const rows = delegates.map((d) => [
    d.delegate_id,
    d.first_name,
    d.last_name,
    d.email,
    d.phone,
    d.class_year,
    d.institution,
    d.city || '',
    d.parent_name || '',
    d.parent_contact || '',
    d.instagram_handle || '',
    d.pref1 || '',
    d.pref2 || '',
    d.experience?.replace(/,/g, ';') || '',
    d.payment_type,
    d.payment_status,
    d.payment_id || '',
    d.amount_paid,
    d.carnival_pass ? 'Yes' : 'No',
    d.referred_by || '',
    (d.committees as { abbreviation?: string })?.abbreviation || '',
    (d.portfolios as { country_or_role?: string })?.country_or_role || '',
    d.allotment_status,
    d.checked_in ? 'Yes' : 'No',
    d.checkin_time ? new Date(d.checkin_time).toLocaleString('en-IN') : '',
    new Date(d.created_at).toLocaleString('en-IN'),
  ].map(val => `"${String(val).replace(/"/g, '""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  await logAudit({
    action: 'CSV_EXPORTED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    details: { rows: delegates.length },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="yds-delegates-${Date.now()}.csv"`,
    },
  });
}
