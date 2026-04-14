import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';
import { sendAllotmentEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const { delegateId } = await req.json();
  if (!delegateId) return apiError('Missing delegateId');

  const supabase = createAdminClient();

  // Get full delegate data (admins trigger this but get no PII)
  const { data: delegate } = await supabase
    .from('delegates')
    .select(`
      *,
      committees:committee_assigned(name, abbreviation),
      portfolios:portfolio_assigned(country_or_role)
    `)
    .eq('id', delegateId)
    .single();

  if (!delegate) return apiError('Delegate not found', 404);
  if (delegate.allotment_status !== 'ASSIGNED') {
    return apiError('Portfolio must be assigned before sending confirmation');
  }

  await sendAllotmentEmail({
    ...delegate,
    committee_name: (delegate.committees as { name: string; abbreviation: string })?.name || 'TBC',
    portfolio_name: (delegate.portfolios as { country_or_role: string })?.country_or_role || 'TBC',
  });

  await supabase
    .from('delegates')
    .update({ confirmation_sent: true, confirmation_sent_at: new Date().toISOString() })
    .eq('id', delegateId);

  await logAudit({
    action: 'CONFIRMATION_EMAIL_SENT',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: delegateId,
  });

  return apiSuccess({ success: true });
}
