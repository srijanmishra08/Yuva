import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const supabase = createAdminClient();
  const [
    { count: delegates },
    { count: checked_in },
    { count: assigned },
    { count: verified },
  ] = await Promise.all([
    supabase.from('delegates').select('id', { count: 'exact', head: true }),
    supabase.from('delegates').select('id', { count: 'exact', head: true }).eq('checked_in', true),
    supabase.from('delegates').select('id', { count: 'exact', head: true }).eq('allotment_status', 'ASSIGNED'),
    supabase.from('delegates').select('id', { count: 'exact', head: true }).eq('payment_status', 'VERIFIED'),
  ]);

  return apiSuccess({ delegates, checked_in, assigned, verified });
}
