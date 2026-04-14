-- ============================================================
-- YUVA Portal — Super Admin Config Migration
-- Run this in Supabase SQL Editor AFTER the initial schema.sql
-- ============================================================

-- ============================================================
-- PORTAL CONFIG (key-value store for global settings)
-- ============================================================
CREATE TABLE portal_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL DEFAULT '{}',
  label TEXT,
  description TEXT,
  updated_by UUID REFERENCES admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE portal_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass portal_config" ON portal_config
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Super admin portal_config" ON portal_config
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
  );
CREATE POLICY "Public read portal_config" ON portal_config
  FOR SELECT USING (TRUE);

-- ============================================================
-- FORM FIELDS (dynamic registration form fields)
-- ============================================================
CREATE TABLE form_fields (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  field_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT,
  field_type TEXT NOT NULL DEFAULT 'text', -- text | textarea | select | checkbox | tel | email | number
  section TEXT NOT NULL DEFAULT 'delegate', -- delegate | address | parent | additional | committee | experience | fees | referral
  is_required BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  options JSONB DEFAULT '[]', -- for select fields: [{value, label}]
  validation_rules JSONB DEFAULT '{}', -- {min, max, pattern, message}
  help_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass form_fields" ON form_fields FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read form_fields" ON form_fields FOR SELECT USING (TRUE);
CREATE POLICY "Admin manage form_fields" ON form_fields FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

CREATE TRIGGER form_fields_updated_at
  BEFORE UPDATE ON form_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
CREATE TABLE email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_key TEXT UNIQUE NOT NULL, -- registration_confirmation | allotment_confirmation | custom_blast
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- available template variables
  is_active BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES admins(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass email_templates" ON email_templates FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Super admin email_templates" ON email_templates FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- ============================================================
-- ANNOUNCEMENTS / BANNERS
-- ============================================================
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info | warning | success | urgent
  target_audience TEXT DEFAULT 'all', -- all | delegates | admins
  is_active BOOLEAN DEFAULT TRUE,
  show_on_dashboard BOOLEAN DEFAULT TRUE,
  show_on_register BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role bypass announcements" ON announcements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Public read active announcements" ON announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admin manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE id = auth.uid() AND is_active = TRUE)
);

-- ============================================================
-- SEED: PORTAL CONFIG
-- ============================================================
INSERT INTO portal_config (config_key, config_value, label, description) VALUES
  ('event', '{
    "name": "YUVA Diplomacy Summit",
    "edition": "YDS 2026",
    "dates": "TBD",
    "venue": "TBD",
    "city": "India",
    "tagline": "Shaping Tomorrow''s Diplomats",
    "logo_url": "",
    "banner_url": ""
  }', 'Event Details', 'Core conference information displayed throughout the portal'),

  ('pricing', '{
    "base_fee": 499,
    "base_fee_description": "Registration Fee + Food + Participation",
    "addons": [
      {
        "id": "carnival_pass",
        "label": "Funology Carnival & Sundowner Pass",
        "description": "Add exclusive carnival & sundowner experience",
        "price": 199,
        "enabled": true
      }
    ],
    "currency": "INR",
    "currency_symbol": "₹"
  }', 'Pricing Configuration', 'Base fees and optional add-ons'),

  ('registration', '{
    "is_open": true,
    "max_delegates": 120,
    "registration_deadline": null,
    "show_seat_counter": false,
    "success_redirect": "/dashboard",
    "terms_url": ""
  }', 'Registration Settings', 'Control registration availability and limits'),

  ('portal', '{
    "maintenance_mode": false,
    "maintenance_message": "We are performing scheduled maintenance. Please check back shortly.",
    "checkin_enabled": true,
    "delegate_pass_enabled": true,
    "schedule_visible": true,
    "committee_info_visible": true
  }', 'Portal Settings', 'Global portal feature toggles'),

  ('social', '{
    "instagram": "",
    "twitter": "",
    "facebook": "",
    "website": "https://yds.funology.club",
    "support_email": "conference@funology.in",
    "support_phone": ""
  }', 'Social & Contact', 'Social links and contact information');

-- ============================================================
-- SEED: FORM FIELDS (mirrors current registration form)
-- ============================================================
INSERT INTO form_fields (field_key, label, placeholder, field_type, section, is_required, sort_order) VALUES
  -- Delegate section
  ('first_name',     'First Name',                 'Arjun',                              'text',     'delegate',    TRUE,  1),
  ('last_name',      'Last Name',                  'Sharma',                             'text',     'delegate',    TRUE,  2),
  ('email',          'Email Address',              'arjun@example.com',                  'email',    'delegate',    TRUE,  3),
  ('phone',          'Contact Number',             '+91 98765 43210',                    'tel',      'delegate',    TRUE,  4),
  ('class_year',     'Class or Year & Stream',     'Class 12 — Science / B.A. 2nd Year', 'text',     'delegate',    TRUE,  5),
  ('institution',    'Institution',                'Delhi Public School',                 'text',     'delegate',    TRUE,  6),
  -- Address section
  ('address',        'Full Address',               'House No., Street, Area',            'textarea', 'address',     TRUE,  1),
  ('pin_code',       'PIN Code',                   '110001',                             'text',     'address',     TRUE,  2),
  ('city',           'City',                       'New Delhi',                          'text',     'address',     TRUE,  3),
  -- Parent section
  ('parent_name',    'Name of Parent / Guardian',  'Rajesh Sharma',                      'text',     'parent',      TRUE,  1),
  ('parent_contact', 'Parent Contact Number',      '+91 98765 43210',                    'tel',      'parent',      TRUE,  2),
  -- Additional section
  ('instagram_handle','Instagram Handle',          'yourhandle',                         'text',     'additional',  FALSE, 1),
  -- Committee section
  ('pref1',          'Committee Preference 1',     '',                                   'select',   'committee',   TRUE,  1),
  ('portfolio_pref1','Portfolio Preference (Comm 1)','e.g., India, USA...',             'text',     'committee',   FALSE, 2),
  ('pref2',          'Committee Preference 2',     '',                                   'select',   'committee',   TRUE,  3),
  -- Experience section
  ('experience',     'Previous MUN Experience / Awards', 'e.g., Best Delegate at XYZ MUN...', 'textarea', 'experience', FALSE, 1),
  -- Referral section
  ('referred_by',    'Referred By',                'Name of person who referred you',   'text',     'referral',    FALSE, 1);

-- ============================================================
-- SEED: EMAIL TEMPLATES
-- ============================================================
INSERT INTO email_templates (template_key, name, subject, body_html, variables) VALUES
  ('registration_confirmation', 'Registration Confirmation', 
   '🎖️ Registration Confirmed — YUVA Diplomacy Summit | {{delegate_id}}',
   '<!-- Template managed via Admin UI -->',
   '["delegate_id", "first_name", "last_name", "institution", "class_year", "amount_paid", "carnival_pass"]'
  ),
  ('allotment_confirmation', 'Portfolio Allotment',
   '🌍 Your Committee Assignment — YUVA Diplomacy Summit | {{delegate_id}}',
   '<!-- Template managed via Admin UI -->',
   '["delegate_id", "first_name", "last_name", "committee_name", "portfolio_name", "institution"]'
  );

-- ============================================================
-- INDEX
-- ============================================================
CREATE INDEX idx_form_fields_section ON form_fields(section, sort_order);
CREATE INDEX idx_announcements_active ON announcements(is_active, target_audience);
CREATE INDEX idx_portal_config_key ON portal_config(config_key);
