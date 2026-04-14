import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);
  if (params.id === auth.userId) return apiError('Cannot deactivate yourself');

  const { is_active } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase.from('admins').update({ is_active }).eq('id', params.id);
  if (error) return apiError(error.message);

  await logAudit({
    action: is_active ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: params.id,
  });
  return apiSuccess({ updated: true });
}
