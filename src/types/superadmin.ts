// ============================================================
// Super Admin Extended Types
// ============================================================

export interface PortalConfig {
  id: string;
  config_key: string;
  config_value: Record<string, unknown>;
  label: string;
  description: string;
  updated_at: string;
}

export interface EventConfig {
  name: string;
  edition: string;
  dates: string;
  venue: string;
  city: string;
  tagline: string;
  logo_url: string;
  banner_url: string;
}

export interface PricingAddon {
  id: string;
  label: string;
  description: string;
  price: number;
  enabled: boolean;
}

export interface PricingConfig {
  base_fee: number;
  base_fee_description: string;
  addons: PricingAddon[];
  currency: string;
  currency_symbol: string;
}

export interface RegistrationConfig {
  is_open: boolean;
  max_delegates: number;
  registration_deadline: string | null;
  show_seat_counter: boolean;
  success_redirect: string;
  terms_url: string;
}

export interface PortalSettings {
  maintenance_mode: boolean;
  maintenance_message: string;
  checkin_enabled: boolean;
  delegate_pass_enabled: boolean;
  schedule_visible: boolean;
  committee_info_visible: boolean;
}

export interface FormField {
  id: string;
  field_key: string;
  label: string;
  placeholder: string;
  field_type: 'text' | 'textarea' | 'select' | 'checkbox' | 'tel' | 'email' | 'number';
  section: string;
  is_required: boolean;
  is_visible: boolean;
  sort_order: number;
  options: { value: string; label: string }[];
  validation_rules: Record<string, unknown>;
  help_text: string;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  body_html: string;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  target_audience: 'all' | 'delegates' | 'admins';
  is_active: boolean;
  show_on_dashboard: boolean;
  show_on_register: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  is_active: boolean;
  created_at: string;
}

export type SuperAdminTab =
  | 'event'
  | 'committees'
  | 'pricing'
  | 'formbuilder'
  | 'admins'
  | 'emails'
  | 'blast'
  | 'announcements'
  | 'system';
