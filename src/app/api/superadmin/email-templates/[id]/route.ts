import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { subject, body_html, name } = await req.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('email_templates')
    .update({ subject, body_html, name, updated_by: auth.userId, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return apiError(error.message);

  await logAudit({ action: 'EMAIL_TEMPLATE_UPDATED', actorId: auth.userId!, actorRole: auth.role!, targetId: params.id });
  return apiSuccess({ saved: true });
}
