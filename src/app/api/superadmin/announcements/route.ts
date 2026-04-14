import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  return apiSuccess({ announcements: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const body = await req.json();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...body, created_by: auth.userId })
    .select()
    .single();

  if (error) return apiError(error.message);
  return apiSuccess({ announcement: data }, 201);
}
