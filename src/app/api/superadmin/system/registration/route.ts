import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);
  const supabase = createAdminClient();
  const { data } = await supabase.from('portal_config').select('config_value').eq('config_key', 'registration').single();
  return apiSuccess({ config: data?.config_value ?? null });
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);
  const body = await req.json();
  const supabase = createAdminClient();
  await supabase.from('portal_config').update({ config_value: body, updated_by: auth.userId }).eq('config_key', 'registration');
  return apiSuccess({ saved: true });
}
