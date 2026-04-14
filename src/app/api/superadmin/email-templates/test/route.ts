import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { template_id, test_email } = await req.json();
  if (!template_id || !test_email) return apiError('template_id and test_email required');

  const supabase = createAdminClient();
  const { data: template } = await supabase.from('email_templates').select('*').eq('id', template_id).single();
  if (!template) return apiError('Template not found');

  // Replace variables with sample data
  const sampleData: Record<string, string> = {
    delegate_id: 'YDS26-001',
    first_name: 'Test',
    last_name: 'Delegate',
    institution: 'Test School',
    class_year: 'Class 12',
    amount_paid: '499',
    committee_name: 'UNHRC',
    portfolio_name: 'India',
  };

  const body = template.body_html.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => sampleData[key] || `[${key}]`);
  const subject = `[TEST] ${template.subject.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => sampleData[key] || `[${key}]`)}`;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: test_email,
    subject,
    html: body,
  });

  return apiSuccess({ sent: true });
}
