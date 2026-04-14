import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyAdminSession, apiError, apiSuccess } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const auth = await verifyAdminSession(req);
  if (!auth.isAdmin || auth.role !== 'SUPER_ADMIN') return apiError('Super Admin required', 403);

  const { filters } = await req.json();
  const supabase = createAdminClient();

  // Build query with joins
  let query = supabase
    .from('delegates')
    .select(`
      id,
      delegate_id,
      first_name,
      last_name,
      email,
      institution,
      class_year,
      city,
      payment_status,
      allotment_status,
      checked_in,
      carnival_pass,
      referred_by,
      portfolios (
        id,
        country_or_role,
        committees ( id, name, abbreviation )
      )
    `)
    .order('created_at', { ascending: false });

  // ── Apply filters ──────────────────────────────────────────

  // Payment status
  if (filters.payment_status) {
    query = query.eq('payment_status', filters.payment_status);
  } else {
    // Default: only show verified delegates (exclude failed/abandoned registrations)
    query = query.in('payment_status', ['VERIFIED', 'COMPLIMENTARY', 'CASH']);
  }

  // Allotment status
  if (filters.allotment_status) {
    query = query.eq('allotment_status', filters.allotment_status);
  }

  // Checked in
  if (filters.checked_in === 'true') query = query.eq('checked_in', true);
  if (filters.checked_in === 'false') query = query.eq('checked_in', false);

  // Carnival pass
  if (filters.carnival_pass === 'true') query = query.eq('carnival_pass', true);
  if (filters.carnival_pass === 'false') query = query.eq('carnival_pass', false);

  // Class/year (partial match)
  if (filters.class_year_contains?.trim()) {
    query = query.ilike('class_year', `%${filters.class_year_contains.trim()}%`);
  }

  // Referred by
  if (filters.referred_by_contains?.trim()) {
    query = query.ilike('referred_by', `%${filters.referred_by_contains.trim()}%`);
  }

  // Cities (multi-select)
  if (filters.cities?.length > 0) {
    query = query.in('city', filters.cities);
  }

  const { data: rawDelegates, error } = await query;
  if (error) return apiError(error.message);

  let delegates = rawDelegates || [];

  // ── Post-query filters (need joined data) ──────────────────

  // Committee filter (abbreviation-based)
  if (filters.committees?.length > 0) {
    delegates = delegates.filter((d: any) => {
      const abbr = d.portfolios?.committees?.abbreviation;
      return abbr && filters.committees.includes(abbr);
    });
  }

  // Portfolio contains
  if (filters.portfolio_contains?.trim()) {
    const term = filters.portfolio_contains.trim().toLowerCase();
    delegates = delegates.filter((d: any) =>
      d.portfolios?.country_or_role?.toLowerCase().includes(term)
    );
  }

  // ── Shape output ───────────────────────────────────────────
  const result = delegates.map((d: any) => ({
    id: d.id,
    delegate_id: d.delegate_id,
    first_name: d.first_name,
    last_name: d.last_name,
    email: d.email,
    institution: d.institution,
    class_year: d.class_year,
    city: d.city,
    committee_abbr: d.portfolios?.committees?.abbreviation ?? null,
    portfolio_name: d.portfolios?.country_or_role ?? null,
  }));

  return apiSuccess({ delegates: result, total: result.length });
}
