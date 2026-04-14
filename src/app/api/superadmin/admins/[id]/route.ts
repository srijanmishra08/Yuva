import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);
  if (params.id === auth.userId) return apiError('Cannot delete yourself');

  const supabase = createAdminClient();
  await supabase.from('admins').delete().eq('id', params.id);
  await supabase.auth.admin.deleteUser(params.id);

  await logAudit({ action: 'ADMIN_DELETED', actorId: auth.userId!, actorRole: auth.role!, targetId: params.id });
  return apiSuccess({ deleted: true });
}
