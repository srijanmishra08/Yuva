import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

async function getConfig(key: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('portal_config').select('config_value').eq('config_key', key).single();
  return data?.config_value ?? null;
}

async function setConfig(key: string, value: Record<string, unknown>, actorId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('portal_config')
    .update({ config_value: value, updated_by: actorId, updated_at: new Date().toISOString() })
    .eq('config_key', key);
  return !error;
}

// ── event-config ──────────────────────────────────────────────
export const eventConfigHandlers = {
  async GET(req: NextRequest) {
    const auth = await verifyAdminSession(req);
    if (!auth.isAdmin) return apiError('Unauthorized', 401);
    const config = await getConfig('event');
    return apiSuccess({ config });
  },
  async PUT(req: NextRequest) {
    const auth = await verifyAdminSession(req);
    if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);
    const body = await req.json();
    const ok = await setConfig('event', body, auth.userId!);
    return ok ? apiSuccess({ saved: true }) : apiError('Failed to save');
  },
};

// ── pricing ───────────────────────────────────────────────────
export const pricingHandlers = {
  async GET(req: NextRequest) {
    const auth = await verifyAdminSession(req);
    if (!auth.isAdmin) return apiError('Unauthorized', 401);
    const config = await getConfig('pricing');
    return apiSuccess({ config });
  },
  async PUT(req: NextRequest) {
    const auth = await verifyAdminSession(req);
    if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);
    const body = await req.json();
    const ok = await setConfig('pricing', body, auth.userId!);
    return ok ? apiSuccess({ saved: true }) : apiError('Failed to save');
  },
};
