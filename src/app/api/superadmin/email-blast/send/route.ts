import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';
import nodemailer from 'nodemailer';

// Re-use the same audience-resolution logic from preview
async function resolveAudience(filters: Record<string, unknown>, supabase: ReturnType<typeof createAdminClient>) {
  let query = supabase
    .from('delegates')
    .select(`
      id, delegate_id, first_name, last_name, email,
      institution, class_year, city, carnival_pass, checked_in,
      payment_status, allotment_status, referred_by,
      portfolios ( country_or_role, committees ( abbreviation, name ) )
    `);

  // Default: only real registrations
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status as string);
  } else {
    query = query.in('payment_status', ['VERIFIED', 'COMPLIMENTARY', 'CASH']);
  }

  if (filters.allotment_status) query = query.eq('allotment_status', filters.allotment_status as string);
  if (filters.checked_in === 'true') query = query.eq('checked_in', true);
  if (filters.checked_in === 'false') query = query.eq('checked_in', false);
  if (filters.carnival_pass === 'true') query = query.eq('carnival_pass', true);
  if (filters.carnival_pass === 'false') query = query.eq('carnival_pass', false);

  if ((filters.class_year_contains as string)?.trim())
    query = query.ilike('class_year', `%${(filters.class_year_contains as string).trim()}%`);
  if ((filters.referred_by_contains as string)?.trim())
    query = query.ilike('referred_by', `%${(filters.referred_by_contains as string).trim()}%`);
  if ((filters.cities as string[])?.length > 0)
    query = query.in('city', filters.cities as string[]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let delegates = data || [];

  if ((filters.committees as string[])?.length > 0) {
    delegates = delegates.filter((d: any) =>
      (filters.committees as string[]).includes(d.portfolios?.committees?.abbreviation)
    );
  }
  if ((filters.portfolio_contains as string)?.trim()) {
    const term = (filters.portfolio_contains as string).trim().toLowerCase();
    delegates = delegates.filter((d: any) =>
      d.portfolios?.country_or_role?.toLowerCase().includes(term)
    );
  }

  return delegates;
}

// Personalise HTML with delegate-specific variables
function personalise(template: string, delegate: any): string {
  return template
    .replace(/\{\{first_name\}\}/g, delegate.first_name ?? '')
    .replace(/\{\{last_name\}\}/g, delegate.last_name ?? '')
    .replace(/\{\{delegate_id\}\}/g, delegate.delegate_id ?? '')
    .replace(/\{\{committee\}\}/g, delegate.portfolios?.committees?.abbreviation ?? '')
    .replace(/\{\{committee_full\}\}/g, delegate.portfolios?.committees?.name ?? '')
    .replace(/\{\{portfolio\}\}/g, delegate.portfolios?.country_or_role ?? '')
    .replace(/\{\{institution\}\}/g, delegate.institution ?? '')
    .replace(/\{\{email\}\}/g, delegate.email ?? '')
    .replace(/\{\{city\}\}/g, delegate.city ?? '');
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { subject, preview_text, body_html, filters } = await req.json();

  if (!subject?.trim()) return apiError('Subject is required');
  if (!body_html?.trim()) return apiError('Email body is required');

  const supabase = createAdminClient();

  // Resolve audience
  let delegates: any[];
  try {
    delegates = await resolveAudience(filters || {}, supabase);
  } catch (e: any) {
    return apiError(`Failed to resolve audience: ${e.message}`);
  }

  if (delegates.length === 0) return apiError('No recipients match the given filters');

  // Create blast record (status: sending)
  const recipientSnapshot = delegates.map((d: any) => ({
    email: d.email,
    name: `${d.first_name} ${d.last_name}`,
    delegate_id: d.delegate_id,
  }));

  const { data: blastRecord, error: blastErr } = await supabase
    .from('email_blasts')
    .insert({
      subject,
      body_html,
      preview_text: preview_text || '',
      filters: filters || {},
      recipient_count: delegates.length,
      recipient_emails: recipientSnapshot,
      status: 'sending',
      created_by: auth.userId,
    })
    .select()
    .single();

  if (blastErr || !blastRecord) return apiError('Failed to create blast record');

  // Setup mailer
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  let sentCount = 0;
  let failedCount = 0;
  const errorLog: { email: string; error: string }[] = [];

  // Send emails in batches of 10 to avoid rate limits
  const BATCH = 10;
  for (let i = 0; i < delegates.length; i += BATCH) {
    const batch = delegates.slice(i, i + BATCH);
    await Promise.allSettled(
      batch.map(async (delegate: any) => {
        try {
          const personalSubject = personalise(subject, delegate);
          const personalBody = personalise(body_html, delegate);

          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: delegate.email,
            subject: personalSubject,
            html: personalBody,
            // Add preview text as a hidden preheader inside the body (if not already present)
            ...(preview_text ? {
              html: personalBody.replace(
                '<body>',
                `<body><div style="display:none;max-height:0;overflow:hidden;">${preview_text}</div>`
              ),
            } : {}),
          });

          sentCount++;
        } catch (err: any) {
          failedCount++;
          errorLog.push({ email: delegate.email, error: err.message });
        }
      })
    );

    // Small delay between batches to be gentle on SMTP
    if (i + BATCH < delegates.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Update blast record to final state
  await supabase.from('email_blasts').update({
    status: failedCount === delegates.length ? 'failed' : 'sent',
    sent_count: sentCount,
    failed_count: failedCount,
    error_log: errorLog,
    sent_at: new Date().toISOString(),
  }).eq('id', blastRecord.id);

  await logAudit({
    action: 'EMAIL_BLAST_SENT',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: blastRecord.id,
    details: {
      subject,
      recipient_count: delegates.length,
      sent_count: sentCount,
      failed_count: failedCount,
      filters,
    },
  });

  return apiSuccess({ sent_count: sentCount, failed_count: failedCount, blast_id: blastRecord.id });
}
