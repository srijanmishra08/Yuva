import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const supabase = createAdminClient();
  const { data } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
  return apiSuccess({ admins: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { name, email, password, role } = await req.json();
  if (!name || !email || !password) return apiError('Name, email, and password required');
  if (password.length < 8) return apiError('Password must be at least 8 characters');

  const supabase = createAdminClient();

  // Create auth user
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authErr || !authUser.user) return apiError(authErr?.message || 'Failed to create auth user');

  // Create admin record
  const { data: admin, error: adminErr } = await supabase
    .from('admins')
    .insert({
      id: authUser.user.id,
      name,
      email,
      role: role || 'ADMIN',
      is_active: true,
      created_by: auth.userId,
    })
    .select()
    .single();

  if (adminErr) {
    // Rollback auth user
    await supabase.auth.admin.deleteUser(authUser.user.id);
    return apiError(adminErr.message);
  }

  await logAudit({
    action: 'ADMIN_CREATED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    targetId: admin.id,
    details: { name, email, role: role || 'ADMIN' },
  });

  return apiSuccess({ admin }, 201);
}
