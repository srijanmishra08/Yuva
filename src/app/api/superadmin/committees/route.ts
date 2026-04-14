import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const { data: committees } = await supabase
    .from('committees')
    .select('*, portfolios(*)')
    .order('name');

  return apiSuccess({ committees: committees || [] });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const body = await req.json();
  const { name, abbreviation, description, max_seats } = body;
  if (!name || !abbreviation) return apiError('Name and abbreviation required');

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('committees')
    .insert({ name, abbreviation: abbreviation.toUpperCase(), description, max_seats: max_seats || 25 })
    .select()
    .single();

  if (error) return apiError(error.message);

  await logAudit({ action: 'COMMITTEE_CREATED', actorId: auth.userId!, actorRole: auth.role!, targetId: data.id, details: { name, abbreviation } });
  return apiSuccess({ committee: data }, 201);
}
