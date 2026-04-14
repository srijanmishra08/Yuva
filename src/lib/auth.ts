import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { createAdminClient } from './supabase';
import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@/types';

/**
 * Verify admin session and role from API route
 */
export async function verifyAdminSession(req: NextRequest): Promise<{
  isAdmin: boolean;
  role?: UserRole;
  userId?: string;
  error?: string;
}> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'No authorization header' };
  }

  const token = authHeader.split(' ')[1];
  const supabase = createAdminClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { isAdmin: false, error: 'Invalid token' };
  }

  const { data: admin } = await supabase
    .from('admins')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!admin || !admin.is_active) {
    return { isAdmin: false, error: 'Not an active admin' };
  }

  return {
    isAdmin: true,
    role: admin.role as UserRole,
    userId: user.id,
  };
}

/**
 * Log audit action
 */
export async function logAudit(params: {
  action: string;
  actorId: string;
  actorRole: UserRole;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const supabase = createAdminClient();
  await supabase.from('audit_logs').insert({
    action: params.action,
    actor_id: params.actorId,
    actor_role: params.actorRole,
    target_id: params.targetId,
    details: params.details || {},
    ip_address: params.ipAddress,
  });
}

/**
 * Helper to return API error responses
 */
export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}
