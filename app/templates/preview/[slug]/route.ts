import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { receiptTemplates } from '@/data/templates';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const { data, error } = await supabase.from('templates').select('id,name,slug,category,thumbnail,active,featured,metadata').eq('slug', slug).single();
    const fallbackTemplate = receiptTemplates.find((template) => template.id === slug);

    if (error && !fallbackTemplate) return NextResponse.json({ error: error.message }, { status: 404 });
    const template = data || {
      id: fallbackTemplate?.id,
      name: fallbackTemplate?.name,
      slug: fallbackTemplate?.id,
      category: fallbackTemplate?.category,
    };

    const demo = {
      receiptNumber: 'PS-2026-000874',
      referenceNumber: 'REF-EDU-2026-1001',
      customerName: 'Jyotirmoy Podder',
      customerEmail: 'student@example.com',
      gender: 'Male',
      nationality: 'Bangladesh',
      fatherName: 'Bijoy Krishan Podder',
      dateOfBirth: '19-10-2004',
      university: 'Chandigarh University, India',
      course: 'BBA Professional',
      amount: 35000,
      totalAmount: 35000,
      paidAmount: 35000,
      currency: 'INR',
      amountInWords: 'Thirty Five Thousand Indian Rupees Only',
      paymentPurpose: 'Tuition Fee (Today)',
      paymentType: 'Cash',
      paymentPeriod: '07/04/2026',
      chequeNumber: '',
      date: '07/04/2026',
      companyName: 'ProvatSoft Ecosystem',
      branchName: template.name,
      companyAddress: 'Roy Bhavan, 916/2 Bownazar, 1st Floor, Noapara, Abhaynagar -7460, Jessore, Khulna Bangladesh',
      phone: '+8801629975806',
      altPhone: '+918910001280',
      email: 'edu.provatsoft@gmail.com',
      website: 'www.provatsoft.com',
      notes: 'No refund are paid.',
      terms: 'This payment receipt is generated and approved by Provatsoft Payment System Software.',
      receivedBy: 'Shuvo Ghosh',
      designation: 'Managing Director, Education Abroad Branch',
    };

    // Standalone browser preview. The app preview components are separate; this route needs a plain HTML renderer.
    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Preview - ${template.name}</title>
          <style>
            *{box-sizing:border-box}
            body{margin:0;font-family:Inter,Arial,sans-serif;background:#e8eef7;padding:24px;color:#0f172a}
            .frame{max-width:1220px;margin:0 auto}
            @media print{body{background:#fff;padding:0}.frame{max-width:none}}
          </style>
        </head>
        <body>
          <div class="frame" id="root">Loading preview...</div>
          <script>
            window.__TEMPLATE = ${JSON.stringify(template)};
            window.__DEMO = ${JSON.stringify(demo)};
          </script>
          <script src="/templates/preview-client.js"></script>
        </body>
      </html>`;

    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
