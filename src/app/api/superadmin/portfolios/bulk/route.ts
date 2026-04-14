import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { committee_id, entries } = await req.json();
  if (!committee_id || !Array.isArray(entries) || entries.length === 0) return apiError('committee_id and entries array required');

  const supabase = createAdminClient();
  const rows = entries.map((e: string) => ({ committee_id, country_or_role: e.trim() }));

  // Use upsert to skip duplicates
  const { data, error } = await supabase
    .from('portfolios')
    .upsert(rows, { onConflict: 'committee_id,country_or_role', ignoreDuplicates: true })
    .select();

  if (error) return apiError(error.message);
  return apiSuccess({ added: data?.length ?? 0, total: entries.length });
}
