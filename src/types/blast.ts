// Append to src/types/superadmin.ts

export interface BlastFilter {
  committees: string[];           // committee abbreviations e.g. ['UNHRC', 'UNSC']
  class_year_contains: string;    // free text substring match e.g. '9' matches 'Class 9'
  cities: string[];               // city names
  payment_status: string;         // '' | 'VERIFIED' | 'PENDING' | 'FAILED'
  allotment_status: string;       // '' | 'PENDING' | 'ASSIGNED'
  checked_in: string;             // '' | 'true' | 'false'
  carnival_pass: string;          // '' | 'true' | 'false'
  portfolio_contains: string;     // substring match on portfolio name
  referred_by_contains: string;   // referral source filter
}

export interface BlastPreviewDelegate {
  id: string;
  delegate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  institution: string;
  class_year: string;
  city: string;
  committee_abbr?: string;
  portfolio_name?: string;
}

export interface EmailBlastRecord {
  id: string;
  subject: string;
  preview_text: string;
  filters: BlastFilter;
  recipient_count: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_count: number;
  failed_count: number;
  created_by: string;
  sent_at: string | null;
  created_at: string;
}
