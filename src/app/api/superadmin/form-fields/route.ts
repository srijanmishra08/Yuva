import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess, logAudit } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin) return apiError('Unauthorized', 401);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('form_fields')
    .select('*')
    .order('section')
    .order('sort_order');

  return apiSuccess({ fields: data || [] });
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { fields } = await req.json();
  if (!Array.isArray(fields)) return apiError('fields array required');

  const supabase = createAdminClient();

  // Separate existing vs new fields
  const existing = fields.filter((f: { id: string }) => !f.id.startsWith('new_'));
  const newFields = fields.filter((f: { id: string }) => f.id.startsWith('new_'));

  // Update existing
  for (const field of existing) {
    await supabase.from('form_fields').update({
      label: field.label,
      placeholder: field.placeholder,
      field_type: field.field_type,
      section: field.section,
      is_required: field.is_required,
      is_visible: field.is_visible,
      sort_order: field.sort_order,
      options: field.options || [],
      help_text: field.help_text || '',
      validation_rules: field.validation_rules || {},
    }).eq('id', field.id);
  }

  // Insert new
  for (const field of newFields) {
    await supabase.from('form_fields').insert({
      field_key: field.field_key,
      label: field.label,
      placeholder: field.placeholder || '',
      field_type: field.field_type,
      section: field.section,
      is_required: field.is_required,
      is_visible: field.is_visible,
      sort_order: field.sort_order,
      options: field.options || [],
      help_text: field.help_text || '',
      validation_rules: field.validation_rules || {},
    });
  }

  await logAudit({
    action: 'FORM_FIELDS_UPDATED',
    actorId: auth.userId!,
    actorRole: auth.role!,
    details: { field_count: fields.length },
  });

  return apiSuccess({ saved: true, total: fields.length });
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { id } = await req.json();
  const supabase = createAdminClient();
  const { error } = await supabase.from('form_fields').delete().eq('id', id);
  if (error) return apiError(error.message);
  return apiSuccess({ deleted: true });
}
