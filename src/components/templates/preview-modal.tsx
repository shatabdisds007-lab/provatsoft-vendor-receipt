'use client';

import React, { useState } from 'react';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { TemplateRenderer } from './template-renderer';
import type { ReceiptDraft } from '@/types/receipt';

interface PreviewModalProps {
  slug: string;
  onClose: () => void;
}

function makePreviewDraft(slug: string): ReceiptDraft {
  const draft: ReceiptDraft = {
    receiptNumber: `PREVIEW-${slug.toUpperCase()}`,
    referenceNumber: 'REF-2026-1001',
    date: '2026-06-02',
    companyName: 'Provatsoft Demo',
    branchName: 'Dhaka Branch',
    companyLogoUrl: '',
    watermarkUrl: '',
    companyAddress: '123 Sample Street, Dhaka',
    phone: '+880 1234 567890',
    email: 'billing@provatsoft.com',
    website: 'www.provatsoft.com',
    customerName: 'Sample Customer',
    customerEmail: 'customer@example.com',
    gender: 'Male',
    nationality: 'Bangladeshi',
    fatherName: 'Mr. Rahman',
    dateOfBirth: '2000-01-01',
    university: 'Sample University',
    course: 'Software Engineering',
    amount: 35000,
    totalAmount: 35000,
    paidAmount: 35000,
    amountInWords: 'Thirty five thousand taka only',
    currency: 'BDT',
    paymentType: 'Bank Transfer',
    paymentPurpose: 'Service fee payment',
    paymentPeriod: '2026',
    chequeNumber: '',
    notes: 'This is a sample receipt preview.',
    terms: 'Generated for template preview only.',
    receivedBy: 'Admin Officer',
    designation: 'Accounts Manager',
    signatureUrl: '',
    stampUrl: '',
    templateId: slug,
    vendorId: 'preview',
  };

  if (slug.includes('education') || slug.includes('university')) {
    draft.companyName = 'Provatsoft Education';
    draft.branchName = 'Academic Campus';
    draft.customerName = 'Demo Student';
    draft.customerEmail = 'student@example.com';
    draft.paymentPurpose = slug.includes('university') ? 'University admission fee' : 'Tuition fee';
  } else if (slug.includes('corporate') || slug.includes('executive')) {
    draft.companyName = 'ABC Corporation';
    draft.customerName = 'Enterprise Client';
    draft.paymentPurpose = 'Software development services';
    draft.amount = 120000;
    draft.totalAmount = 120000;
    draft.paidAmount = 120000;
    draft.amountInWords = 'One hundred twenty thousand taka only';
  } else if (slug.includes('luxury')) {
    draft.companyName = 'Luxe Holdings';
    draft.customerName = 'VIP Client';
    draft.paymentPurpose = 'Premium service package';
    draft.amount = 250000;
    draft.totalAmount = 250000;
    draft.paidAmount = 250000;
    draft.amountInWords = 'Two hundred fifty thousand taka only';
  } else if (slug.includes('ngo')) {
    draft.companyName = 'Global Charity Foundation';
    draft.customerName = 'Community Donor';
    draft.paymentPurpose = 'Donation to community fund';
    draft.amount = 5000;
    draft.totalAmount = 5000;
    draft.paidAmount = 5000;
    draft.amountInWords = 'Five thousand taka only';
  } else if (slug.includes('healthcare')) {
    draft.companyName = 'Bright Clinic';
    draft.customerName = 'Patient Name';
    draft.paymentPurpose = 'Medical consultation fee';
  } else if (slug.includes('government')) {
    draft.companyName = 'Department of Services';
    draft.customerName = 'Citizen Applicant';
    draft.paymentPurpose = 'Official service charge';
  }

  return draft;
}

export default function PreviewModal({ slug, onClose }: PreviewModalProps) {
  const [zoom, setZoom] = useState(100);
  const [mode, setMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const width = mode === 'desktop' ? 1024 : mode === 'tablet' ? 768 : 375;
  const draft = makePreviewDraft(slug);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/60 p-6">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="relative w-full max-w-[1200px] rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Template preview</h3>
            <div className="text-sm text-slate-500">{slug}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1">
              <button onClick={() => setZoom((z) => Math.max(50, z - 25))} className="text-sm font-semibold">-</button>
              <span className="text-sm font-medium">{zoom}%</span>
              <button onClick={() => setZoom((z) => Math.min(150, z + 25))} className="text-sm font-semibold">+</button>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-2 py-1">
              <button onClick={() => setMode('desktop')} className={`p-2 ${mode==='desktop'?'bg-blue-600 text-white rounded-md':''}`} aria-label="Desktop"><Monitor className="h-4 w-4" /></button>
              <button onClick={() => setMode('tablet')} className={`p-2 ${mode==='tablet'?'bg-blue-600 text-white rounded-md':''}`} aria-label="Tablet"><Tablet className="h-4 w-4" /></button>
              <button onClick={() => setMode('mobile')} className={`p-2 ${mode==='mobile'?'bg-blue-600 text-white rounded-md':''}`} aria-label="Mobile"><Smartphone className="h-4 w-4" /></button>
            </div>
            <button onClick={onClose} aria-label="Close preview" className="rounded-md p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-auto rounded-lg border bg-slate-50 p-4">
            <div
              className="mx-auto origin-top rounded-md"
              style={{ width, maxWidth: '100%', transform: `scale(${zoom / 100})` }}
            >
              <TemplateRenderer slug={slug} draft={draft} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
