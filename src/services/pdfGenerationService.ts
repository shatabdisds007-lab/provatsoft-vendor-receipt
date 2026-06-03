import { supabaseAdmin } from '@/lib/supabaseAdminClient';

export async function logPdfGenerationEvent(params: {
  templateSlug: string;
  templateName: string;
  status: 'success' | 'fallback' | 'error';
  receiptNumber?: string | null;
  pdfUrl?: string | null;
  fileName?: string | null;
  fallbackUsed?: boolean;
  message?: string | null;
}) {
  try {
    await supabaseAdmin.from('pdf_generation_logs').insert([
      {
        template_slug: params.templateSlug,
        template_name: params.templateName,
        status: params.status,
        receipt_number: params.receiptNumber || null,
        pdf_url: params.pdfUrl || null,
        file_name: params.fileName || null,
        fallback_used: params.fallbackUsed || false,
        message: params.message || null,
      },
    ]);
  } catch (error) {
    console.error('PDF generation logger failed', error);
  }
}
