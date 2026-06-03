import { NextRequest, NextResponse } from 'next/server';
import { renderPdfBufferForTemplate } from '@/lib/templates/renderPdfServer';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug') || 'education-branch';

    // demo draft
    const draft = {
      receiptNumber: 'PS-2026-000100',
      referenceNumber: 'REF-100',
      date: new Date().toISOString().slice(0, 10),
      companyName: 'ProvatSoft Labs',
      branchName: 'Dhaka Headquarters',
      companyLogoUrl: '',
      watermarkUrl: '',
      companyAddress: '210 6th Ave, Dhaka, Bangladesh',
      phone: '+880 1234 567890',
      email: 'billing@provatsoft.com',
      website: 'https://provatsoft.com',
      customerName: 'Samira Khan',
      gender: 'Female',
      nationality: 'Bangladeshi',
      fatherName: 'Rahim Uddin',
      dateOfBirth: '1994-05-18',
      university: 'Dhaka University',
      course: 'Advanced Finance',
      amount: 35000,
      totalAmount: 42000,
      paidAmount: 35000,
      amountInWords: 'Thirty five thousand only',
      currency: 'BDT',
      paymentType: 'Bank transfer',
      paymentPurpose: 'Annual subscription renewal',
      paymentPeriod: '2026-07-01 to 2027-06-30',
      chequeNumber: 'CHK-987654',
      notes: 'Includes 12-month premium support and onboarding package.',
      terms: 'Payment due within 30 days of issue. No refunds after 7 days.',
      receivedBy: 'Ayesha Rahman',
      designation: 'Finance Director',
      signatureUrl: '',
      stampUrl: '',
      vendorId: 'VND-2026-777',
    };

      const buffer = await renderPdfBufferForTemplate(slug, draft as any, '', '');
      return new Response(new Uint8Array(buffer as any), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${slug}.pdf"` } });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
