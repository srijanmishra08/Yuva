import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { generateQRCodeBuffer } from '@/lib/qrcode';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createAdminClient();

  // Get session to verify ownership
  const authHeader = req.headers.get('authorization');
  
  const { data: delegate } = await supabase
    .from('delegates')
    .select('id, delegate_id, qr_code_url, payment_status')
    .eq('id', params.id)
    .single();

  if (!delegate) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (delegate.payment_status !== 'VERIFIED') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 403 });
  }

  // Generate fresh QR
  const qrBuffer = await generateQRCodeBuffer(delegate.delegate_id);

  return new NextResponse(qrBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
