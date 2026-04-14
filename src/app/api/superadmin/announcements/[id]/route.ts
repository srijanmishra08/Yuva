import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const body = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from('announcements').update(body).eq('id', params.id);
  if (error) return apiError(error.message);
  return apiSuccess({ updated: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const { error } = await supabase.from('announcements').delete().eq('id', params.id);
  if (error) return apiError(error.message);
  return apiSuccess({ deleted: true });
}
