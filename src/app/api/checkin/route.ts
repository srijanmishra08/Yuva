import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyHMACToken, parseQRPayload } from '@/lib/qrcode';
import { apiError, apiSuccess, logAudit } from '@/lib/auth';
import type { CheckinResult } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qr_payload, delegate_id: manualDelegateId } = body;

    const supabase = createAdminClient();
    let delegate;

    if (manualDelegateId) {
      // Manual ID lookup (for volunteer input)
      const { data } = await supabase
        .from('delegates')
        .select(`
          id, delegate_id, first_name, last_name, institution,
          checked_in, checkin_time, payment_status,
          committees:committee_assigned(name, abbreviation),
          portfolios:portfolio_assigned(country_or_role)
        `)
        .eq('delegate_id', manualDelegateId.toUpperCase())
        .single();
      
      delegate = data;
    } else if (qr_payload) {
      // QR code scan
      const parsed = parseQRPayload(qr_payload);
      if (!parsed) {
        return apiError('Invalid QR code format');
      }

      // Verify HMAC
      const isValid = verifyHMACToken(parsed.delegate_id, parsed.hmac);
      if (!isValid) {
        return apiError('Invalid QR code — tampering detected');
      }

      const { data } = await supabase
        .from('delegates')
        .select(`
          id, delegate_id, first_name, last_name, institution,
          checked_in, checkin_time, payment_status,
          committees:committee_assigned(name, abbreviation),
          portfolios:portfolio_assigned(country_or_role)
        `)
        .eq('delegate_id', parsed.delegate_id)
        .single();
      
      delegate = data;
    } else {
      return apiError('Provide either qr_payload or delegate_id');
    }

    if (!delegate) {
      const result: CheckinResult = {
        success: false,
        error: 'Delegate not found',
      };
      return apiSuccess(result);
    }

    if (delegate.payment_status !== 'VERIFIED') {
      const result: CheckinResult = {
        success: false,
        error: 'Payment not verified — entry not permitted',
      };
      return apiSuccess(result);
    }

    // Already checked in
    if (delegate.checked_in) {
      const result: CheckinResult = {
        success: true,
        already_checked_in: true,
        delegate: {
          name: `${delegate.first_name} ${delegate.last_name}`,
          institution: delegate.institution,
          committee: (delegate.committees as { abbreviation: string } | null)?.abbreviation || 'Pending',
          portfolio: (delegate.portfolios as { country_or_role: string } | null)?.country_or_role || 'Pending',
          delegate_id: delegate.delegate_id,
          checked_in: true,
          checkin_time: delegate.checkin_time,
        },
      };
      return apiSuccess(result);
    }

    // Check in now
    await supabase
      .from('delegates')
      .update({
        checked_in: true,
        checkin_time: new Date().toISOString(),
      })
      .eq('id', delegate.id);

    await logAudit({
      action: 'DELEGATE_CHECKIN',
      actorId: 'volunteer',
      actorRole: 'ADMIN',
      targetId: delegate.id,
      details: { delegate_id: delegate.delegate_id },
    });

    const result: CheckinResult = {
      success: true,
      already_checked_in: false,
      delegate: {
        name: `${delegate.first_name} ${delegate.last_name}`,
        institution: delegate.institution,
        committee: (delegate.committees as { abbreviation: string } | null)?.abbreviation || 'Pending',
        portfolio: (delegate.portfolios as { country_or_role: string } | null)?.country_or_role || 'Pending',
        delegate_id: delegate.delegate_id,
        checked_in: true,
      },
    };

    return apiSuccess(result);
  } catch (err) {
    console.error('Check-in error:', err);
    return apiError('Check-in processing failed', 500);
  }
}
