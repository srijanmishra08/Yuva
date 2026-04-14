import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { error, count } = await supabase
    .from('razorpay_orders')
    .delete()
    .eq('status', 'created')
    .lt('created_at', cutoff);

  if (error) return apiError(error.message);

  await logAudit({
    action: 'STALE_ORDERS_PURGED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    details: { deleted: count, cutoff },
  });

  return apiSuccess({ deleted: count ?? 0 });
}
