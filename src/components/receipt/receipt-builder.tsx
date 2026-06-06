'use client';

import { useEffect, useMemo, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FileUpload } from '@/components/ui/file-upload';
import { EducationReceiptPreview } from '@/components/receipt/education-preview';
import { TemplateRenderer } from '@/components/templates/template-renderer';
import { PrintPreviewWrapper } from '@/components/templates/print-preview-wrapper';
import { PdfDocument } from '@/components/receipt/pdf-document';
import { renderPdfBlobForTemplate } from '@/components/templates/template-pdf-renderer';
import { currencyOptions, currencySymbols } from '@/lib/currency';
import { supabase } from '@/lib/supabaseClient';
import type { ReceiptDraft } from '@/types/receipt';

const defaultDraft: ReceiptDraft = {
  receiptNumber: '',
  referenceNumber: '',
  date: new Date().toISOString().slice(0, 10),
  companyName: '',
  branchName: '',
  companyLogoUrl: '',
  watermarkUrl: '',
  companyAddress: '',
  phone: '',
  email: '',
  website: '',
  customerName: '',
  gender: '',
  nationality: '',
  fatherName: '',
  dateOfBirth: '',
  university: '',
  course: '',
  amount: 0,
  totalAmount: 0,
  paidAmount: 0,
  amountInWords: '',
  currency: 'INR',
  paymentType: 'Cash',
  paymentPurpose: '',
  paymentPeriod: '',
  notes: '',
  terms: '',
  signatureUrl: '',
  stampUrl: '',
  chequeNumber: '',
  receivedBy: '',
  designation: '',
  vendorId: '',
};

function readFileUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function ReceiptBuilder() {
  const [draft, setDraft] = useState<ReceiptDraft>(defaultDraft);
  const [companyLogoName, setCompanyLogoName] = useState('');
  const [signatureName, setSignatureName] = useState('');
  const [stampName, setStampName] = useState('');
  const [watermarkName, setWatermarkName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [message, setMessage] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [printRequested, setPrintRequested] = useState(false);

  useEffect(() => {
    async function prepareBuilder() {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id || '';
      setDraft((current) => ({ ...current, vendorId: userId }));

      try {
        const response = await fetch('/api/receipt-number');
        const data = await response.json();
        setDraft((current) => ({ ...current, receiptNumber: data.receiptNumber || current.receiptNumber }));
      } catch {
        setDraft((current) => ({ ...current, receiptNumber: current.receiptNumber || 'PS-2026-000001' }));
      }

      // load selected template from localStorage
      const sel = localStorage.getItem('selected_template');
      if (sel) setActiveTemplate(sel);
    }

    prepareBuilder();
  }, []);

  const dueAmount = useMemo(() => Math.max(0, draft.totalAmount - draft.paidAmount), [draft.paidAmount, draft.totalAmount]);

  useEffect(() => {
    const generatePreviewQr = async () => {
      try {
        const payload = `Receipt: ${draft.receiptNumber}\nCustomer: ${draft.customerName}\nAmount: ${draft.currency} ${draft.amount}\nDate: ${draft.date}`;
        const url = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'H' });
        setQrCodeUrl(url);
      } catch {
        setQrCodeUrl('');
      }
    };

    generatePreviewQr();
  }, [draft.receiptNumber, draft.customerName, draft.currency, draft.amount, draft.date]);

  const updateDraft = (field: keyof ReceiptDraft, value: string | number) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      totalAmount: field === 'amount' ? Number(value) : current.totalAmount,
      paidAmount: field === 'paidAmount' ? Number(value) : current.paidAmount,
    } as ReceiptDraft));
  };

  const setFileValue = async (field: keyof ReceiptDraft, file: File | null, setter: (name: string) => void) => {
    if (!file) {
      setter('');
      setDraft((current) => ({ ...current, [field]: '' } as ReceiptDraft));
      return;
    }

    const url = await readFileUrl(file);
    setter(file.name);
    setDraft((current) => ({ ...current, [field]: url } as ReceiptDraft));
  };

  const buildQrCode = async () => {
    const payload = `Receipt: ${draft.receiptNumber}\nStudent: ${draft.customerName}\nAmount: ${draft.currency} ${draft.amount}\nDate: ${draft.date}`;
    return QRCode.toDataURL(payload, { errorCorrectionLevel: 'H' });
  };

  const generatePdfBlob = async () => {
    setIsGenerating(true);
    setMessage('Generating PDF...');

    try {
      const pdfQrCodeUrl = qrCodeUrl || await buildQrCode();
      console.log('[ReceiptBuilder] generatePdfBlob activeTemplate:', activeTemplate);
      const blob = await renderPdfBlobForTemplate(activeTemplate, draft, draft.watermarkUrl, pdfQrCodeUrl);
      console.log('[ReceiptBuilder] generated blob size:', blob?.size);
      return blob;
    } finally {
      setIsGenerating(false);
      setMessage('');
    }
  };

  const downloadPdf = async () => {
    console.log('[ReceiptBuilder] downloadPdf start, activeTemplate:', activeTemplate);
    const blob = await generatePdfBlob();
    console.log('[ReceiptBuilder] downloadPdf blob size:', blob?.size);
    const url = URL.createObjectURL(blob);
    setPdfUrl(url);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${draft.receiptNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const getAuthHeaders = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const savePdfToStorage = async () => {
    if (!draft.vendorId) {
      setMessage('Vendor session not found. Please sign in.');
      return;
    }

    if (!activeTemplate) {
      setMessage('Select a template before saving the receipt.');
      return;
    }

    console.log('[ReceiptBuilder] savePdfToStorage activeTemplate:', activeTemplate);
    const blob = await generatePdfBlob();
    console.log('[ReceiptBuilder] savePdfToStorage blob size:', blob?.size);
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = `data:application/pdf;base64,${arrayBufferToBase64(arrayBuffer)}`;
    const fileName = `${draft.receiptNumber}.pdf`;
    const authHeaders = await getAuthHeaders();

    const response = await fetch('/api/pdf/save', {
      method: 'POST',
      headers: ({ 'Content-Type': 'application/json', ...(authHeaders as Record<string, string>) } as HeadersInit),
      body: JSON.stringify({
        pdfBase64: base64,
        receiptNumber: draft.receiptNumber,
        fileName,
        metadata: {
          customerName: draft.customerName,
          amount: String(draft.amount),
          currency: draft.currency,
          date: draft.date,
          companyName: draft.companyName,
          templateSlug: activeTemplate,
          watermarkUrl: draft.watermarkUrl,
        },
      }),
    });

    const data = await response.json();

    if (data.error) {
      setMessage(data.error);
      return;
    }

    setMessage('PDF saved successfully.');
    if (data.fileUrl) {
      setPdfUrl(data.fileUrl);
      try {
        const emailHeaders = await getAuthHeaders();
        await fetch('/api/email/send', {
          method: 'POST',
          headers: ({ 'Content-Type': 'application/json', ...(emailHeaders as Record<string, string>) } as HeadersInit),
          body: JSON.stringify({
            recipientEmail: draft.customerEmail || draft.email,
            receiptNumber: draft.receiptNumber,
            subject: `Payment Receipt - ${draft.receiptNumber}`,
            pdfUrl: data.fileUrl,
            fileName,
            metadata: {
              companyLogoUrl: draft.companyLogoUrl,
              companyName: draft.companyName,
              customerName: draft.customerName,
              amount: String(draft.amount),
              currency: draft.currency,
              date: draft.date,
            },
          }),
        });
      } catch (err) {
        console.warn('Auto-send failed', err);
      }
    }
  };

  const printReceipt = async () => {
    if (!activeTemplate) {
      setMessage('Select a template before printing.');
      return;
    }

    console.log('[PRINT] request for template:', activeTemplate);
    setMessage('Preparing template for print...');
    setPrintRequested(true);
  };

  const handlePrintReady = () => {
    console.log('[PRINT] ready');
    console.log('[PRINT] window.print triggered');

    const cleanup = () => {
      setPrintRequested(false);
      setMessage('');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    window.print();

    setTimeout(() => {
      cleanup();
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Receipt builder</p>
            <h1 className="text-4xl font-semibold text-white">Create premium education receipts</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">
              Complete the receipt details and preview the styled education branch receipt instantly as you type.
            </p>
          </div>

          <div className="grid gap-5 rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 1: Company Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company Name">
                  <input
                    value={draft.companyName}
                    onChange={(event) => updateDraft('companyName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Provatsoft Education"
                  />
                </Field>
                <Field label="Branch Name">
                  <input
                    value={draft.branchName}
                    onChange={(event) => updateDraft('branchName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Main Campus"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company Logo Upload">
                  <FileUpload
                    label="Upload logo"
                    accept="image/*"
                    fileName={companyLogoName}
                    onChange={(file) => setFileValue('companyLogoUrl', file, setCompanyLogoName)}
                  />
                </Field>
                <Field label="Watermark Upload">
                  <FileUpload
                    label="Upload watermark"
                    accept="image/*"
                    fileName={watermarkName}
                    onChange={(file) => setFileValue('watermarkUrl', file, setWatermarkName)}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Website">
                  <input
                    value={draft.website}
                    onChange={(event) => updateDraft('website', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="www.provatsoft.com"
                  />
                </Field>
                <Field label="Address">
                  <input
                    value={draft.companyAddress}
                    onChange={(event) => updateDraft('companyAddress', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="123 Academic Ave, Dhaka"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone">
                  <input
                    value={draft.phone}
                    onChange={(event) => updateDraft('phone', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="+880 1234 567890"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(event) => updateDraft('email', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="info@provatsoft.com"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 2: Receipt Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Receipt Number">
                  <input
                    value={draft.receiptNumber}
                    readOnly
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-400 outline-none"
                  />
                </Field>
                <Field label="Reference Number">
                  <input
                    value={draft.referenceNumber}
                    onChange={(event) => updateDraft('referenceNumber', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="REF-2026-1001"
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    value={draft.date}
                    onChange={(event) => updateDraft('date', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 3: Student / Customer Details</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name">
                  <input
                    value={draft.customerName}
                    onChange={(event) => updateDraft('customerName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Student Name"
                  />
                </Field>
                <Field label="Customer Email">
                  <input
                    type="email"
                    value={draft.customerEmail || ''}
                    onChange={(event) => updateDraft('customerEmail', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="student@example.com"
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={draft.gender}
                    onChange={(event) => updateDraft('gender', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field label="Date of Birth">
                  <input
                    type="date"
                    value={draft.dateOfBirth}
                    onChange={(event) => updateDraft('dateOfBirth', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  />
                </Field>
                <Field label="Nationality">
                  <input
                    value={draft.nationality}
                    onChange={(event) => updateDraft('nationality', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Bangladeshi"
                  />
                </Field>
                <Field label="Father's Name">
                  <input
                    value={draft.fatherName}
                    onChange={(event) => updateDraft('fatherName', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Father Name"
                  />
                </Field>
                <Field label="University Name">
                  <input
                    value={draft.university}
                    onChange={(event) => updateDraft('university', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="University Name"
                  />
                </Field>
                <Field label="Course Name">
                  <input
                    value={draft.course}
                    onChange={(event) => updateDraft('course', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Course Name"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 4: Payment Information</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount">
                  <input
                    type="number"
                    value={draft.amount}
                    onChange={(event) => updateDraft('amount', Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="35000"
                  />
                </Field>
                <Field label="Currency">
                  <select
                    value={draft.currency}
                    onChange={(event) => updateDraft('currency', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  >
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount In Words">
                  <input
                    value={draft.amountInWords}
                    onChange={(event) => updateDraft('amountInWords', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Thirty five thousand only"
                  />
                </Field>
                <Field label="Payment Purpose">
                  <input
                    value={draft.paymentPurpose}
                    onChange={(event) => updateDraft('paymentPurpose', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Admission fee"
                  />
                </Field>
                <Field label="Payment Period">
                  <input
                    value={draft.paymentPeriod}
                    onChange={(event) => updateDraft('paymentPeriod', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="June 2026"
                  />
                </Field>
                <Field label="Payment Method">
                  <select
                    value={draft.paymentType}
                    onChange={(event) => updateDraft('paymentType', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </Field>
                {draft.paymentType === 'Cheque' ? (
                  <Field label="Cheque Number">
                    <input
                      value={draft.chequeNumber}
                      onChange={(event) => updateDraft('chequeNumber', event.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                      placeholder="123456"
                    />
                  </Field>
                ) : null}
                <Field label="Paid Amount">
                  <input
                    type="number"
                    value={draft.paidAmount}
                    onChange={(event) => updateDraft('paidAmount', Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="35000"
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 5: Notes</h2>
              <div className="grid gap-4">
                <Field label="Notes">
                  <textarea
                    value={draft.notes}
                    onChange={(event) => updateDraft('notes', event.target.value)}
                    rows={4}
                    className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Add any notes for the receipt here."
                  />
                </Field>
                <Field label="Terms & Conditions">
                  <textarea
                    value={draft.terms}
                    onChange={(event) => updateDraft('terms', event.target.value)}
                    rows={3}
                    className="w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="This receipt is valid for ..."
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Section 6: Signature & Stamp</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <FileUpload
                  label="Upload Signature"
                  accept="image/*"
                  fileName={signatureName}
                  onChange={(file) => setFileValue('signatureUrl', file, setSignatureName)}
                />
                <FileUpload
                  label="Upload Stamp"
                  accept="image/*"
                  fileName={stampName}
                  onChange={(file) => setFileValue('stampUrl', file, setStampName)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Received By">
                  <input
                    value={draft.receivedBy}
                    onChange={(event) => updateDraft('receivedBy', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Name"
                  />
                </Field>
                <Field label="Designation">
                  <input
                    value={draft.designation}
                    onChange={(event) => updateDraft('designation', event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                    placeholder="Designation"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-950/90 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Receipt ready to preview with live updates.</p>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">No page reload required.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="secondary" onClick={printReceipt} className="w-full sm:w-auto" disabled={isGenerating}>
                  Print Receipt
                </Button>
                <Button type="button" variant="ghost" onClick={downloadPdf} className="w-full sm:w-auto">
                  Download PDF
                </Button>
                <Button type="button" variant="primary" onClick={savePdfToStorage} className="w-full sm:w-auto" disabled={isGenerating}>
                  {isGenerating ? 'Saving PDF...' : 'Save PDF'}
                </Button>
              </div>
            </div>

            {message ? <p className="text-sm text-slate-300">{message}</p> : null}
          </div>
        </section>

        <section className="space-y-6 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-glow backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Live preview</p>
              <h2 className="text-3xl font-semibold text-white">Education branch template</h2>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-200">Responsive preview</div>
          </div>
          {/* Template renderer switches instantly based on selected template */}
          {activeTemplate ? (
            <TemplateRenderer slug={activeTemplate} draft={draft} qrCodeUrl={qrCodeUrl} />
          ) : (
            <EducationReceiptPreview draft={draft} qrCodeUrl={qrCodeUrl} />
          )}
        </section>
      </div>

      <div className="hidden print-only">
        <PrintPreviewWrapper
          slug={activeTemplate}
          draft={draft}
          qrCodeUrl={qrCodeUrl}
          watermarkUrl={draft.watermarkUrl}
          active={printRequested}
          onReady={handlePrintReady}
        />
      </div>
    </div>
  );
}
