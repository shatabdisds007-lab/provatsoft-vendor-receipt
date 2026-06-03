import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { isAdminUser, getServerUserId } from '@/lib/auth';
import { validateSubscriptionAction } from '@/lib/subscription';
import { renderPdfBufferForTemplate } from '@/lib/templates/renderPdfServer';
import { uploadFileToPath } from '../../../../services/storage.service';
import { buildSampleDraft, buildSampleQrCode, makeSampleReceiptNumber, normalizeSampleFolder, TemplateRow } from '@/lib/templates/sampleData';

const SYSTEM_VENDOR_ID = '00000000-0000-0000-0000-000000000000';

export async function POST(request: NextRequest) {
  const isAdmin = await isAdminUser(request);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getServerUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const validation = await validateSubscriptionAction(userId, 'batch_generate');
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 403 });
  }

  try {
    const { data: templates, error: templateError } = await supabaseAdmin.from('templates').select('*');
    if (templateError) {
      return NextResponse.json({ error: templateError.message }, { status: 500 });
    }

    const results = await Promise.allSettled(
      (templates || []).map(async (template: TemplateRow) => {
        const templateSlug = template.slug;
        const receiptNumber = makeSampleReceiptNumber(templateSlug);
        const fileName = `${receiptNumber}.pdf`;
        const folder = normalizeSampleFolder(template);
        const filePath = `receipts/samples/${folder}/${templateSlug}/${fileName}`;

        try {
          const draft = await buildSampleDraft(template);
          draft.receiptNumber = receiptNumber;
          draft.referenceNumber = `REF-${templateSlug.slice(0, 8).toUpperCase()}`;
          const qrCodeUrl = await buildSampleQrCode(draft);
          const pdfBuffer = await renderPdfBufferForTemplate(templateSlug, draft, draft.watermarkUrl, qrCodeUrl);

          const uploadResult = await uploadFileToPath('receipts', filePath, pdfBuffer);
          const publicUrl = uploadResult.publicUrl;

          const { data: insertData, error: insertError } = await supabaseAdmin
            .from('receipt_pdfs')
            .insert([
              {
                receipt_number: receiptNumber,
                vendor_id: SYSTEM_VENDOR_ID,
                pdf_url: publicUrl,
                file_name: fileName,
                metadata: {
                  template_slug: templateSlug,
                  template_name: template.name,
                  sample: true,
                  category: template.category,
                },
              },
            ])
            .select('*')
            .single();
          if (insertError) throw insertError;

          const { data: logEntry, error: logError } = await supabaseAdmin
            .from('pdf_generation_logs')
            .insert([
              {
                template_id: template.id,
                template_slug: templateSlug,
                template_name: template.name,
                status: 'success',
                receipt_number: receiptNumber,
                pdf_url: publicUrl,
                file_name: fileName,
                message: null,
              },
            ])
            .select('*')
            .single();
          if (logError) throw logError;

          return {
            template: templateSlug,
            name: template.name,
            status: 'success',
            pdfUrl: publicUrl,
            receiptNumber,
            log: logEntry,
          };
        } catch (error: any) {
          const message = error?.message || 'Unknown error';
          await supabaseAdmin.from('pdf_generation_logs').insert([
            {
              template_id: template.id,
              template_slug: templateSlug,
              template_name: template.name,
              status: 'failed',
              receipt_number: receiptNumber,
              pdf_url: null,
              file_name: fileName,
              message,
            },
          ]);
          return {
            template: templateSlug,
            name: template.name,
            status: 'failed',
            error: message,
          };
        }
      }),
    );

    const payload = (results as Array<any>).map((result) =>
      result.status === 'fulfilled' ? result.value : { status: 'failed', error: result.reason?.message || 'Unhandled rejection' },
    );

    return NextResponse.json({ results: payload });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
