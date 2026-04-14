-- ============================================================
-- YUVA Portal — Email Blast Migration
-- Run in Supabase SQL Editor AFTER superadmin_migration.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS email_blasts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  subject       TEXT NOT NULL,
  body_html     TEXT NOT NULL,
  preview_text  TEXT,
  filters       JSONB NOT NULL DEFAULT '{}',
  recipient_count  INTEGER NOT NULL DEFAULT 0,
  recipient_emails JSONB DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'draft',
  sent_count    INTEGER DEFAULT 0,
  failed_count  INTEGER DEFAULT 0,
  error_log     JSONB DEFAULT '[]',
  created_by    UUID REFERENCES admins(id),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_blasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_blasts" ON email_blasts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "super_admin_blasts" ON email_blasts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );

CREATE INDEX idx_email_blasts_created ON email_blasts(created_at DESC);
CREATE INDEX idx_email_blasts_status  ON email_blasts(status);
