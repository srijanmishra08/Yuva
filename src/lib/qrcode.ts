import QRCode from 'qrcode';
import crypto from 'crypto';

const HMAC_SECRET = process.env.HMAC_CHECKIN_SECRET!;

/**
 * Generate HMAC token for QR payload
 */
export function generateHMACToken(delegateId: string): string {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(delegateId)
    .digest('hex');
}

/**
 * Verify HMAC token
 */
export function verifyHMACToken(delegateId: string, token: string): boolean {
  const expected = generateHMACToken(delegateId);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(token, 'hex')
  );
}

/**
 * Generate QR code as Data URL
 */
export async function generateQRCodeDataURL(delegateId: string): Promise<{
  dataUrl: string;
  token: string;
}> {
  const token = generateHMACToken(delegateId);
  const payload = JSON.stringify({ delegate_id: delegateId, hmac: token });
  
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: {
      dark: '#1F2937',
      light: '#FFF6ED',
    },
  });

  return { dataUrl, token };
}

/**
 * Generate QR code as Buffer (for file storage)
 */
export async function generateQRCodeBuffer(delegateId: string): Promise<Buffer> {
  const token = generateHMACToken(delegateId);
  const payload = JSON.stringify({ delegate_id: delegateId, hmac: token });
  
  return await QRCode.toBuffer(payload, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
  });
}

/**
 * Parse QR payload
 */
export function parseQRPayload(raw: string): { delegate_id: string; hmac: string } | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
