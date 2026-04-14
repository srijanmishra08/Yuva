import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const { error, count } = await supabase
    .from('delegates')
    .update({ checked_in: false, checkin_time: null })
    .eq('checked_in', true);

  if (error) return apiError(error.message);

  await logAudit({
    action: 'CHECKINS_RESET',
    actorId: auth.userId!,
    actorRole: auth.role!,
    details: { count },
  });

  return apiSuccess({ reset: true, count });
}
