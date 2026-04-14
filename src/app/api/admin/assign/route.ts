import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, logAudit, apiError, apiSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const { delegateId, committeeId, portfolioId } = await req.json();

  if (!delegateId || !committeeId || !portfolioId) {
    return apiError('Missing required fields');
  }

  const supabase = createAdminClient();

  // Use a transaction to prevent race conditions
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('is_assigned, assigned_to')
    .eq('id', portfolioId)
    .single();

  if (!portfolio) return apiError('Portfolio not found', 404);
  if (portfolio.is_assigned && portfolio.assigned_to !== delegateId) {
    return apiError('Portfolio already assigned to another delegate');
  }

  // Assign portfolio
  const { error: portError } = await supabase
    .from('portfolios')
    .update({ is_assigned: true, assigned_to: delegateId })
    .eq('id', portfolioId);

  if (portError) return apiError('Failed to assign portfolio');

  // Update delegate
  const { error: delegateError } = await supabase
    .from('delegates')
    .update({
      committee_assigned: committeeId,
      portfolio_assigned: portfolioId,
      allotment_status: 'ASSIGNED',
    })
    .eq('id', delegateId);

  if (delegateError) {
    // Rollback portfolio
    await supabase
      .from('portfolios')
      .update({ is_assigned: false, assigned_to: null })
      .eq('id', portfolioId);
    return apiError('Failed to update delegate');
  }

  // Log audit
  await logAudit({
    action: 'PORTFOLIO_ASSIGNED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: delegateId,
    details: { committeeId, portfolioId },
  });

  return apiSuccess({ success: true, message: 'Portfolio assigned successfully' });
}
