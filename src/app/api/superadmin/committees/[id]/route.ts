import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const body = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('committees')
    .update({
      name: body.name,
      abbreviation: body.abbreviation?.toUpperCase(),
      description: body.description,
      max_seats: body.max_seats,
    })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return apiError(error.message);
  await logAudit({ action: 'COMMITTEE_UPDATED', actorId: auth.userId!, actorRole: auth.role!, targetId: params.id });
  return apiSuccess({ committee: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();

  // Check if any delegates are assigned to this committee
  const { count } = await supabase
    .from('delegates')
    .select('id', { count: 'exact' })
    .eq('committee_assigned', params.id);

  if (count && count > 0) {
    return apiError(`Cannot delete: ${count} delegates are assigned to this committee`);
  }

  const { error } = await supabase.from('committees').delete().eq('id', params.id);
  if (error) return apiError(error.message);

  await logAudit({ action: 'COMMITTEE_DELETED', actorId: auth.userId!, actorRole: auth.role!, targetId: params.id });
  return apiSuccess({ deleted: true });
}
