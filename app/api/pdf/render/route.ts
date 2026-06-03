import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { renderPdfBufferForTemplate } from '@/lib/templates/renderPdfServer';
import type { ReceiptDraft } from '@/types/receipt';

export async function POST(request: NextRequest) {
  try {
    console.log('[api/pdf/render] POST request start', { url: request.url });
    const body = await request.json();
    console.log('[api/pdf/render] request body', body);
    const slug = body?.slug || body?.template || 'education-branch';
    const draft = (body?.draft || body?.receipt) as ReceiptDraft;
    const watermarkUrl = body?.watermarkUrl;
    const qrCodeUrl = body?.qrCodeUrl;

    if (!draft || typeof draft !== 'object') {
      console.error('[api/pdf/render] invalid draft payload', { slug, draft, body });
      return NextResponse.json({ error: 'Missing or invalid draft payload' }, { status: 400 });
    }

    const buffer = await renderPdfBufferForTemplate(slug, draft, watermarkUrl, qrCodeUrl);
    console.log('[api/pdf/render] rendered PDF buffer', { slug, length: buffer.length });
    return new Response(new Uint8Array(buffer as any), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}.pdf"`,
        'Content-Length': String(buffer.length),
      },
      status: 200,
    });
  } catch (error: any) {
    console.error('[api/pdf/render] PDF generation failed', { error: error?.message || error, stack: error?.stack });
    return NextResponse.json({ error: error?.message || 'Internal server error', debug: error?.stack || String(error) }, { status: 500 });
  }
}
