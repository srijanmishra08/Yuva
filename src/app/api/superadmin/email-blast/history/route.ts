import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('email_blasts')
    .select('id, subject, filters, recipient_count, status, sent_count, failed_count, sent_at, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return apiError(error.message);
  return apiSuccess({ blasts: data || [] });
}
