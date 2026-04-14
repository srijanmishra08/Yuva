import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { committee_id, country_or_role } = await req.json();
  if (!committee_id || !country_or_role) return apiError('committee_id and country_or_role required');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('portfolios')
    .insert({ committee_id, country_or_role: country_or_role.trim() })
    .select()
    .single();

  if (error) return apiError(error.code === '23505' ? 'Portfolio already exists' : error.message);
  return apiSuccess({ portfolio: data }, 201);
}
