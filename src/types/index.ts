// ============================================================
// YUVA Portal — TypeScript Types
// ============================================================

export type UserRole = 'DELEGATE' | 'ADMIN' | 'SUPER_ADMIN';
export type PaymentType = 'RAZORPAY' | 'CASH' | 'COMPLIMENTARY';
export type PaymentStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'REFUNDED';
export type AllotmentStatus = 'PENDING' | 'ASSIGNED' | 'CONFIRMED';

export interface Delegate {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  class_year: string;
  institution: string;
  address?: string;
  city?: string;
  pin_code?: string;
  parent_name?: string;
  parent_contact?: string;
  instagram_handle?: string;
  experience?: string;
  pref1?: string;
  portfolio_pref1?: string;
  pref2?: string;
  committee_assigned?: string;
  portfolio_assigned?: string;
  allotment_status: AllotmentStatus;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  payment_id?: string;
  razorpay_order_id?: string;
  amount_paid: number;
  carnival_pass: boolean;
  referred_by?: string;
  qr_code_url?: string;
  qr_token?: string;
  checked_in: boolean;
  checkin_time?: string;
  confirmation_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminDelegate {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  class_year: string;
  institution: string;
  pref1?: string;
  pref2?: string;
  experience?: string;
  committee_assigned?: string;
  portfolio_assigned?: string;
  allotment_status: AllotmentStatus;
  payment_type: PaymentType;
  payment_status: PaymentStatus;
  carnival_pass: boolean;
  checked_in: boolean;
  checkin_time?: string;
  created_at: string;
}

export interface Committee {
  id: string;
  name: string;
  abbreviation: string;
  description?: string;
  max_seats: number;
  created_at: string;
}

export interface Portfolio {
  id: string;
  committee_id: string;
  country_or_role: string;
  is_assigned: boolean;
  assigned_to?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor_role: UserRole;
  target_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// Registration form data
export interface RegistrationFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  class_year: string;
  institution: string;
  address: string;
  pin_code: string;
  city: string;
  parent_name: string;
  parent_contact: string;
  instagram_handle?: string;
  pref1: string;
  portfolio_pref1?: string;
  pref2: string;
  experience?: string;
  carnival_pass: boolean;
  referred_by?: string;
}

// Razorpay types
export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Committee portfolio matrix
export interface CommitteeMatrix {
  committee: Committee;
  portfolios: Portfolio[];
  filled_count: number;
  available_count: number;
}

// QR Check-in
export interface CheckinPayload {
  delegate_id: string;
  hmac: string;
}

export interface CheckinResult {
  success: boolean;
  already_checked_in?: boolean;
  delegate?: {
    name: string;
    institution: string;
    committee: string;
    portfolio: string;
    delegate_id: string;
    checked_in: boolean;
    checkin_time?: string;
  };
  error?: string;
}
