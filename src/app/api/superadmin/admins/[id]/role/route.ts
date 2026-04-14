import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { role } = await req.json();
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) return apiError('Invalid role');

  const supabase = createAdminClient();
  const { error } = await supabase.from('admins').update({ role }).eq('id', params.id);
  if (error) return apiError(error.message);

  await logAudit({
    action: 'ADMIN_ROLE_CHANGED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: params.id,
    details: { new_role: role },
  });
  return apiSuccess({ updated: true });
}
