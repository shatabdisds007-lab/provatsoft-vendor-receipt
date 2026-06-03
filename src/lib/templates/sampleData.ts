import QRCode from 'qrcode';
import type { ReceiptDraft } from '@/types/receipt';

export type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  metadata?: Record<string, any>;
};

const folderMap: Record<string, string> = {
  Education: 'education',
  Corporate: 'corporate',
  Business: 'startup',
  Healthcare: 'healthcare',
  NGO: 'ngo',
  Government: 'government',
};

export function normalizeSampleFolder(template: TemplateRow) {
  const slug = template.slug.toLowerCase();
  if (slug.includes('luxury')) return 'luxury';
  if (slug.includes('startup')) return 'startup';
  if (slug.includes('corporate')) return 'corporate';
  return folderMap[template.category] || 'samples';
}

export function makeSampleReceiptNumber(slug: string) {
  const timestamp = Date.now();
  return `SAMPLE-${slug}-${timestamp}`;
}

function svgDataUrl(text: string, width = 300, height = 120, color = '#0f172a') {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="transparent" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="18" fill="${color}" opacity="0.45">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export async function buildSampleDraft(template: TemplateRow): Promise<ReceiptDraft> {
  const defaultDraft: ReceiptDraft = {
    receiptNumber: '',
    referenceNumber: 'REF-2026-1001',
    date: new Date().toISOString().slice(0, 10),
    companyName: 'Provatsoft Sample',
    branchName: 'Demo Branch',
    companyLogoUrl: '',
    watermarkUrl: '',
    companyAddress: '123 Sample Street, Dhaka',
    phone: '+880 1234 567890',
    email: 'info@example.com',
    website: 'www.provatsoft.com',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    gender: 'Male',
    nationality: 'Bangladeshi',
    fatherName: 'Mr. Doe',
    dateOfBirth: '2000-01-01',
    university: 'Sample University',
    course: 'Computer Science',
    amount: 35000,
    totalAmount: 35000,
    paidAmount: 35000,
    amountInWords: 'Thirty five thousand only',
    currency: 'INR',
    paymentType: 'Cash',
    paymentPurpose: 'Sample fee payment',
    paymentPeriod: '2026',
    chequeNumber: '',
    notes: 'This is a generated sample receipt.',
    terms: 'This receipt is valid for demonstration only.',
    receivedBy: 'Admin',
    designation: 'Manager',
    signatureUrl: svgDataUrl('Authorized', 240, 80),
    stampUrl: svgDataUrl('Sample Stamp', 120, 120),
    vendorId: '00000000-0000-0000-0000-000000000000',
  };

  const slug = template.slug.toLowerCase();
  const draft = { ...defaultDraft };

  if (slug.includes('education') || slug.includes('tuition') || slug.includes('training') || slug.includes('university')) {
    draft.companyName = 'Provatsoft Education';
    draft.branchName = 'Academic Campus';
    draft.customerName = 'John Doe';
    draft.customerEmail = 'john.doe@student.university.com';
    draft.university = 'Sample University';
    draft.course = 'Data Science';
    draft.amount = 35000;
    draft.totalAmount = 35000;
    draft.paidAmount = 35000;
    draft.amountInWords = 'Thirty five thousand taka only';
    draft.paymentPurpose = slug.includes('university') ? 'University admission fee' : 'Tuition fee';
    draft.paymentType = 'Bank Transfer';
    draft.notes = 'Sample education receipt for academic fee payment.';
    draft.watermarkUrl = svgDataUrl('Education', 400, 120, '#0b5dd7');
  } else if (slug.includes('corporate') || slug.includes('business') || slug.includes('professional')) {
    draft.companyName = 'ABC Corporation';
    draft.companyAddress = '55 Business Park, Dhaka';
    draft.customerName = 'ABC Corp';
    draft.customerEmail = 'accounts@abccorp.com';
    draft.paymentPurpose = 'Software Development Services';
    draft.amount = 120000;
    draft.totalAmount = 120000;
    draft.paidAmount = 120000;
    draft.amountInWords = 'One hundred twenty thousand taka only';
    draft.paymentType = 'Online Transfer';
    draft.notes = 'Generated sample corporate invoice for consulting services.';
    draft.watermarkUrl = svgDataUrl('Corporate', 420, 120, '#0f172a');
  } else if (slug.includes('executive') || slug.includes('elegant')) {
    draft.companyName = 'Executive Solutions';
    draft.customerName = 'High Value Client';
    draft.customerEmail = 'client@exec-solutions.com';
    draft.amount = 95000;
    draft.totalAmount = 95000;
    draft.paidAmount = 95000;
    draft.amountInWords = 'Ninety five thousand taka only';
    draft.paymentPurpose = 'Executive advisory fee';
    draft.paymentType = 'Cheque';
    draft.watermarkUrl = svgDataUrl('Executive', 420, 120, '#111827');
  } else if (slug.includes('startup')) {
    draft.companyName = 'LaunchPad Studio';
    draft.customerName = 'Startup Client';
    draft.customerEmail = 'hello@launchpad.studio';
    draft.amount = 78000;
    draft.totalAmount = 78000;
    draft.paidAmount = 78000;
    draft.amountInWords = 'Seventy eight thousand taka only';
    draft.paymentPurpose = 'Brand design & launch services';
    draft.paymentType = 'Online';
    draft.watermarkUrl = svgDataUrl('Startup', 420, 120, '#0ea5a4');
  } else if (slug.includes('luxury')) {
    draft.companyName = 'Luxe Holdings';
    draft.customerName = 'VIP Client';
    draft.customerEmail = 'vip@luxeholdings.com';
    draft.amount = 250000;
    draft.totalAmount = 250000;
    draft.paidAmount = 250000;
    draft.amountInWords = 'Two hundred fifty thousand taka only';
    draft.paymentPurpose = 'Premium service package';
    draft.paymentType = 'Bank Transfer';
    draft.watermarkUrl = svgDataUrl('Luxury', 420, 120, '#d4af37');
  } else if (slug.includes('government')) {
    draft.companyName = 'Department of Services';
    draft.customerName = 'Government Office';
    draft.customerEmail = 'office@gov.bd';
    draft.amount = 50000;
    draft.totalAmount = 50000;
    draft.paidAmount = 50000;
    draft.amountInWords = 'Fifty thousand taka only';
    draft.paymentPurpose = 'Official service charge';
    draft.paymentType = 'Bank Transfer';
    draft.watermarkUrl = svgDataUrl('Official', 420, 120, '#0f172a');
  } else if (slug.includes('ngo')) {
    draft.companyName = 'Global Charity Foundation';
    draft.customerName = 'Global Charity';
    draft.customerEmail = 'donor@globalcharity.org';
    draft.amount = 5000;
    draft.totalAmount = 5000;
    draft.paidAmount = 5000;
    draft.amountInWords = 'Five thousand taka only';
    draft.paymentPurpose = 'Donation to community fund';
    draft.paymentType = 'Online';
    draft.watermarkUrl = svgDataUrl('Donation', 420, 120, '#065f46');
  }

  return draft;
}

export async function buildSampleQrCode(draft: ReceiptDraft) {
  const payload = `Receipt ${draft.receiptNumber}\nName: ${draft.customerName}\nAmount: ${draft.currency} ${draft.amount}`;
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'H' });
}
