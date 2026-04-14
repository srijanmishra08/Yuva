import nodemailer from 'nodemailer';
import { Delegate } from '@/types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send registration confirmation email
 */
export async function sendRegistrationEmail(delegate: Delegate & {
  committee_name?: string;
  portfolio_name?: string;
}) {
  const subject = `🎖️ Registration Confirmed — YUVA Diplomacy Summit | ${delegate.delegate_id}`;
  const html = registrationEmailTemplate(delegate);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'YUVA Diplomacy Summit <conference@funology.in>',
    to: delegate.email,
    subject,
    html,
  });
}

/**
 * Send allotment confirmation email
 */
export async function sendAllotmentEmail(delegate: Delegate & {
  committee_name: string;
  portfolio_name: string;
}) {
  const subject = `🌍 Your Committee Assignment — YUVA Diplomacy Summit | ${delegate.delegate_id}`;
  const html = allotmentEmailTemplate(delegate);

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'YUVA Diplomacy Summit <conference@funology.in>',
    to: delegate.email,
    subject,
    html,
  });
}

// ============================================================
// EMAIL TEMPLATES
// ============================================================

function registrationEmailTemplate(delegate: Delegate): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Registration Confirmed — YUVA Diplomacy Summit</title>
</head>
<body style="margin:0;padding:0;background-color:#111827;font-family:'Montserrat',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1F2937;border-radius:24px;overflow:hidden;border:1px solid rgba(255,170,51,0.3);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#FFAA33,#C68642);padding:40px;text-align:center;">
              <p style="margin:0;font-family:Impact,Arial;font-size:14px;letter-spacing:6px;color:#1F2937;text-transform:uppercase;">YUVA DIPLOMACY SUMMIT</p>
              <h1 style="margin:8px 0 0;font-family:Impact,Arial;font-size:48px;color:#111827;letter-spacing:2px;">YDS 2026</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#FFAA33;font-size:24px;font-weight:800;">Registration Confirmed! 🎉</h2>
              <p style="color:#FFF6ED;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Dear ${delegate.first_name},<br/><br/>
                Your registration for the <strong style="color:#FFAA33;">YUVA Diplomacy Summit 2026</strong> has been confirmed. Welcome to the delegation!
              </p>

              <!-- Delegate ID Card -->
              <div style="background:#111827;border:1px solid rgba(255,170,51,0.4);border-radius:16px;padding:24px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 4px;color:rgba(255,246,237,0.5);font-size:12px;letter-spacing:4px;text-transform:uppercase;">Your Delegate ID</p>
                <p style="margin:0;color:#FFAA33;font-family:Impact,Arial;font-size:36px;letter-spacing:4px;">${delegate.delegate_id}</p>
              </div>

              <!-- Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                ${detailRow('Name', `${delegate.first_name} ${delegate.last_name}`)}
                ${detailRow('Institution', delegate.institution)}
                ${detailRow('Class / Year', delegate.class_year)}
                ${detailRow('Payment', `₹${delegate.amount_paid} — ${delegate.payment_type}`)}
                ${delegate.carnival_pass ? detailRow('Carnival Pass', '✅ Included') : ''}
              </table>

              <p style="color:rgba(255,246,237,0.7);font-size:14px;line-height:1.8;margin:24px 0;">
                Your committee assignment will be sent separately once allotments are finalized. 
                You can log in to your dashboard to track your status.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display:inline-block;background:linear-gradient(135deg,#FFAA33,#C68642);color:#111827;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:1px;">
                  VIEW DASHBOARD →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#111827;padding:24px 40px;border-top:1px solid rgba(255,170,51,0.2);">
              <p style="margin:0;color:rgba(255,246,237,0.4);font-size:12px;text-align:center;line-height:1.8;">
                YUVA Diplomacy Summit 2026 | Organized by Funology<br/>
                <a href="mailto:conference@funology.in" style="color:#FFAA33;">conference@funology.in</a> | 
                <a href="${process.env.NEXT_PUBLIC_LANDING_URL}" style="color:#FFAA33;">yds.funology.club</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function allotmentEmailTemplate(delegate: Delegate & { committee_name: string; portfolio_name: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Committee Assignment — YUVA Diplomacy Summit</title>
</head>
<body style="margin:0;padding:0;background-color:#111827;font-family:'Montserrat',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1F2937;border-radius:24px;overflow:hidden;border:1px solid rgba(255,170,51,0.3);">
          
          <tr>
            <td style="background:linear-gradient(135deg,#FFAA33,#C68642);padding:40px;text-align:center;">
              <p style="margin:0;font-family:Impact,Arial;font-size:14px;letter-spacing:6px;color:#1F2937;text-transform:uppercase;">YUVA DIPLOMACY SUMMIT</p>
              <h1 style="margin:8px 0 0;font-family:Impact,Arial;font-size:48px;color:#111827;letter-spacing:2px;">ALLOTMENT</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#FFAA33;font-size:24px;font-weight:800;">Your Assignment is Here! 🌍</h2>
              <p style="color:#FFF6ED;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Dear ${delegate.first_name},<br/><br/>
                Congratulations! Your committee and portfolio assignment for <strong style="color:#FFAA33;">YUVA Diplomacy Summit 2026</strong> is now official.
              </p>

              <!-- Assignment Card -->
              <div style="background:linear-gradient(135deg,rgba(255,170,51,0.1),rgba(198,134,66,0.1));border:1px solid rgba(255,170,51,0.4);border-radius:20px;padding:32px;margin:24px 0;text-align:center;">
                <p style="margin:0 0 4px;color:rgba(255,246,237,0.5);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Committee</p>
                <p style="margin:0 0 20px;color:#FFAA33;font-family:Impact,Arial;font-size:28px;letter-spacing:2px;">${delegate.committee_name}</p>
                
                <div style="height:1px;background:rgba(255,170,51,0.2);margin:16px 0;"></div>
                
                <p style="margin:0 0 4px;color:rgba(255,246,237,0.5);font-size:11px;letter-spacing:4px;text-transform:uppercase;">Portfolio</p>
                <p style="margin:0;color:#FFF6ED;font-size:24px;font-weight:800;">${delegate.portfolio_name}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                ${detailRow('Delegate ID', delegate.delegate_id)}
                ${detailRow('Delegate', `${delegate.first_name} ${delegate.last_name}`)}
                ${detailRow('Institution', delegate.institution)}
              </table>

              <p style="color:rgba(255,246,237,0.7);font-size:14px;line-height:1.8;margin:24px 0;">
                Please begin your research on your assigned portfolio. Your delegate pass with QR code is available on your dashboard.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/delegate-pass" 
                   style="display:inline-block;background:linear-gradient(135deg,#FFAA33,#C68642);color:#111827;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:1px;">
                  VIEW DELEGATE PASS →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="background:#111827;padding:24px 40px;border-top:1px solid rgba(255,170,51,0.2);">
              <p style="margin:0;color:rgba(255,246,237,0.4);font-size:12px;text-align:center;line-height:1.8;">
                YUVA Diplomacy Summit 2026 | Organized by Funology<br/>
                <a href="mailto:conference@funology.in" style="color:#FFAA33;">conference@funology.in</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,246,237,0.1);">
        <span style="color:rgba(255,246,237,0.5);font-size:12px;text-transform:uppercase;letter-spacing:1px;">${label}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid rgba(255,246,237,0.1);text-align:right;">
        <span style="color:#FFF6ED;font-weight:600;font-size:14px;">${value}</span>
      </td>
    </tr>`;
}
