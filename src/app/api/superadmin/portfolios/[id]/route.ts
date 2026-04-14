import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();

  const { data: portfolio } = await supabase.from('portfolios').select('is_assigned').eq('id', params.id).single();
  if (portfolio?.is_assigned) return apiError('Cannot delete: this portfolio is currently assigned to a delegate');

  const { error } = await supabase.from('portfolios').delete().eq('id', params.id);
  if (error) return apiError(error.message);
  return apiSuccess({ deleted: true });
}
