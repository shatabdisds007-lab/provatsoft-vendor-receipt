'use client';

import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { useToast, ToastProvider } from '@/components/ui/toast';
import { printPdfBlob, renderPdfBlobForTemplate } from '@/components/templates/template-pdf-renderer';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { receiptSchema, ReceiptSchema } from '@/features/receipts/schema';
import { useReceiptDraft } from '@/hooks/useReceiptDraft';
import { supabase } from '@/lib/supabaseClient';
import StepCompanyInfo from './StepCompanyInfo';
import StepReceiptInfo from './StepReceiptInfo';
import StepCustomerInfo from './StepCustomerInfo';
import StepPaymentInfo from './StepPaymentInfo';
import StepAdditionalInfo from './StepAdditionalInfo';
import LivePreview from './LivePreview';
import TopActionBar from './TopActionBar';
import AccordionSection from './AccordionSection';
import PreviewPanel from './PreviewPanel';
import BrandingPanel from './BrandingPanel';
import AutosaveIndicator from './AutosaveIndicator';
import Breadcrumbs from '@/components/dashboard/Breadcrumbs';
import GlassCard from '@/components/ui/GlassCard';
import { GripVertical } from 'lucide-react';

const STEPS = ['Company', 'Receipt', 'Customer', 'Payment', 'Additional'] as const;

export default function ReceiptBuilderShell() {
  const draftApi = useReceiptDraft();

  const methods = useForm<ReceiptSchema>({
    defaultValues: draftApi.draft as ReceiptSchema,
    mode: 'onChange',
  });

  const { handleSubmit, reset, watch, getValues, trigger, formState } = methods;

  useEffect(() => {
    // when draft is loaded externally, reset form values
    reset(draftApi.draft as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auto-save on changes (debounced by draftApi)
  useEffect(() => {
    const subscription = watch((value) => {
      draftApi.setDraft(value as any);
      draftApi.saveDebounced(value as any, 1200);
    });
    return () => subscription.unsubscribe();
  }, [watch, draftApi]);

  // unsaved changes protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draftApi.isDirty) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      return undefined;
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [draftApi.isDirty]);

  const buildQrCodeForReceipt = async (values: ReceiptSchema) => {
    const payload = `Receipt: ${values.receiptNumber}\nCustomer: ${values.customerName}\nAmount: ${values.currency} ${values.amount}\nDate: ${values.date}`;
    return QRCode.toDataURL(payload, { errorCorrectionLevel: 'H' });
  };

  const renderCurrentTemplatePdf = async (values: ReceiptSchema) => {
    const selectedTemplate = localStorage.getItem('selected_template') || 'education-branch';
    const qrCodeUrl = await buildQrCodeForReceipt(values);
    return renderPdfBlobForTemplate(selectedTemplate, values as any, (values as any).watermarkUrl, qrCodeUrl);
  };

  const handlePrintCurrentTemplate = async () => {
    const values = methods.getValues();
    const blob = await renderCurrentTemplatePdf(values);
    printPdfBlob(blob);
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const values = methods.getValues();
        draftApi.save(values as any);
        draftApi.setIsDirty(false);
        // small feedback
        // eslint-disable-next-line no-alert
        alert('Saved (Ctrl+S)');
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrintCurrentTemplate().catch((err) => {
          console.error('[ReceiptBuilderShell] template print failed', err);
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [methods]);

  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = STEPS[stepIndex];

  const next = async () => {
    // validate current step
    const values = getValues();
    const partial = extractForStep(values, stepIndex);
    const schema = schemaForStep(stepIndex);
    const parsed = schema.safeParse(partial);
    if (!parsed.success) {
      // map zod errors to RHF
      const issues = parsed.error.issues;
      issues.forEach((issue) => {
        methods.setError(issue.path.join('.') as any, { type: 'manual', message: issue.message } as any);
      });
      return false;
    }
    setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
    return true;
  };

  const back = () => setStepIndex((s) => Math.max(0, s - 1));

  // Actions component uses the Toast context and has access to local functions
  function Actions() {
    const toast = useToast();

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

      const getAuthHeaders = async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        return token ? { Authorization: `Bearer ${token}` } : {};
      };

      const handleGeneratePdf = async () => {
        try {
          toast({ title: 'Generating PDF...', type: 'info' });
          const values = methods.getValues();
          await draftApi.save(values as any);
          draftApi.setIsDirty(false);

          const selectedTemplate = localStorage.getItem('selected_template');
          console.log('[ReceiptBuilderShell] selectedTemplate from localStorage:', selectedTemplate);
          if (!selectedTemplate) {
            toast({ title: 'No template selected', description: 'Choose a template from the gallery first', type: 'error' });
            return { blob: null, fileUrl: null, fallback: true };
          }

          const qrCodeUrl = await buildQrCodeForReceipt(values);

          console.log('[FLOW] PDF START', { selectedTemplate });
          const blob = await renderCurrentTemplatePdf(values);
          console.log('[ReceiptBuilderShell] blob size:', blob?.size);
          const arrayBuffer = await blob.arrayBuffer();
          const base64 = `data:application/pdf;base64,${arrayBufferToBase64(arrayBuffer)}`;
          const fileName = `${values.receiptNumber || Date.now()}.pdf`;
          const authHeaders = await getAuthHeaders();

          toast({ title: 'Uploading PDF...', type: 'info' });
          const response = await fetch('/api/pdf/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders } as Record<string, string>,
            body: JSON.stringify({
              pdfBase64: base64,
              receiptNumber: values.receiptNumber,
              fileName,
              receiptId: draftApi.receiptId,
              metadata: {
                templateSlug: selectedTemplate,
                customerName: values.customerName,
                amount: String(values.amount),
                currency: values.currency,
                date: values.date,
              },
            }),
          });

          const data = await response.json();
          console.log('[ReceiptBuilderShell] /api/pdf/save response', data);

          const shouldOpenLocal = !data?.fileUrl;
          if (shouldOpenLocal) {
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank');
            toast({ title: 'PDF generated locally', description: 'Saved locally because server save was unavailable.', type: 'success' });
            return { blob, fileUrl: null, fallback: true };
          }

          toast({ title: 'PDF Generated Successfully', type: 'success' });
          if (data.fileUrl) {
            console.log('[ReceiptBuilderShell] opening fileUrl', data.fileUrl);
            window.open(data.fileUrl, '_blank');
          }
          return { blob, fileUrl: data.fileUrl, fallback: data.fallback || false };
        } catch (err: any) {
          toast({ title: 'PDF generation failed', description: err?.message || String(err), type: 'error' });
          return { blob: null, fileUrl: null, fallback: true };
        }
      };

      const handleSendEmail = async () => {
        try {
          toast({ title: 'Preparing email...', type: 'info' });
          console.log('[ReceiptBuilderShell] handleSendEmail starting');
          const values = methods.getValues();
          const pdfResult = await handleGeneratePdf();

          if (!pdfResult?.blob) {
            toast({ title: 'Email failed', description: 'PDF generation failed before sending email.', type: 'error' });
            return;
          }

          const pdfUrl = pdfResult.fileUrl || '';
          const authHeaders = await getAuthHeaders();
          const sendRes = await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders } as Record<string, string>,
            body: JSON.stringify({
              recipientEmail: values.customerEmail || values.email,
              pdfUrl,
              fileName: `${values.receiptNumber}.pdf`,
              subject: `Payment Receipt - ${values.receiptNumber}`,
              receiptNumber: values.receiptNumber,
              receiptId: draftApi.receiptId,
            }),
          });

          const sendJson = await sendRes.json();
          if (sendJson.error) {
            toast({ title: 'Email failed', description: sendJson.error, type: 'error' });
            return;
          }

          const toastTitle = sendJson.mock ? 'Email mocked locally' : 'Email queued';
          const toastDescription = sendJson.mock ? 'Email send is mocked because Supabase or email service was unavailable.' : 'Email has been queued for delivery';
          toast({ title: toastTitle, description: toastDescription, type: 'success' });
        } catch (err: any) {
          toast({ title: 'Email failed', description: err?.message || String(err), type: 'error' });
        }
      };

      const handleDuplicate = async () => {
        try {
          const values = methods.getValues();
          const res = await fetch('/api/receipt-number');
          const json = await res.json();
          const newNum = json.receiptNumber || `COPY-${Date.now()}`;
          const copy = { ...values, receiptNumber: newNum };
          draftApi.setReceiptId?.(undefined);
          await draftApi.save(copy as any);
          reset(copy as any);
          toast({ title: 'Receipt Duplicated', description: `New number: ${newNum}`, type: 'success' });
        } catch (err: any) {
          toast({ title: 'Duplicate failed', description: err?.message || String(err), type: 'error' });
        }
      };

      return (
        <TopActionBar
          onSave={async () => {
            const values = methods.getValues();
            await draftApi.save(values as any);
            draftApi.setIsDirty(false);
            toast({ title: 'Draft saved', type: 'success' });
          }}
          onGenerate={async () => await handleGeneratePdf()}
          onEmail={async () => await handleSendEmail()}
          onPrint={async () => {
            try {
              toast({ title: 'Preparing template for print...', type: 'info' });
              await handlePrintCurrentTemplate();
            } catch (err: any) {
              toast({ title: 'Print failed', description: err?.message || String(err), type: 'error' });
            }
          }}
          onDuplicate={async () => await handleDuplicate()}
          rightContent={<AutosaveIndicator draftApi={draftApi} />}
        />
      );
    }

    const onSubmit = async (values: ReceiptSchema) => {
    // validate full
    const parsed = receiptSchema.safeParse(values);
    if (!parsed.success) {
      // set first error
      const first = parsed.error.issues[0];
      methods.setError(first.path.join('.') as any, { type: 'manual', message: first.message } as any);
      return;
    }
    // finalize: save draft to localStorage and server
    await draftApi.save(values as any);
    draftApi.setIsDirty(false);
    alert('Receipt draft saved. Draft sync is now enabled.');
  };

  return (
    <div className="min-h-screen">
      <Breadcrumbs items={[{ label: 'Dashboard', href: '/dashboard/vendor' }, { label: 'Create receipt' }]} />
      <ToastProvider>
        <FormProvider {...methods}>
          <Actions />

          <div className="grid gap-6 xl:grid-cols-[40%_60%]">
            <div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <AccordionSection title="Company Information" subtitle="Logo, address and contacts" open={stepIndex === 0} onToggle={() => setStepIndex(0)}>
                    <StepCompanyInfo />
                  </AccordionSection>

                  <AccordionSection title="Receipt Details" subtitle="Number, date and currency" open={stepIndex === 1} onToggle={() => setStepIndex(1)}>
                    <StepReceiptInfo />
                  </AccordionSection>

                  <AccordionSection title="Customer Information" subtitle="Student / customer fields" open={stepIndex === 2} onToggle={() => setStepIndex(2)}>
                    <StepCustomerInfo />
                  </AccordionSection>

                  <AccordionSection title="Payment Information" subtitle="Amounts and payment method" open={stepIndex === 3} onToggle={() => setStepIndex(3)}>
                    <StepPaymentInfo />
                  </AccordionSection>

                  <AccordionSection title="Branding" subtitle="Logos, signature, stamps" open={stepIndex === 4} onToggle={() => setStepIndex(4)}>
                    <BrandingPanel setValue={methods.setValue} getValues={methods.getValues} />
                  </AccordionSection>

                  <AccordionSection title="Notes" subtitle="Notes and terms" open={stepIndex === 5} onToggle={() => setStepIndex(5)}>
                    <StepAdditionalInfo />
                  </AccordionSection>

                  <div className="sticky bottom-6 z-30 mt-4 flex items-center gap-3">
                    <button type="button" onClick={async () => { const values = methods.getValues(); await draftApi.save(values as any); draftApi.setIsDirty(false); alert('Saved'); }} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Save</button>
                    <button type="submit" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Save Draft</button>
                    <button type="button" onClick={() => draftApi.clear()} className="ml-auto rounded-xl px-4 py-2 text-sm font-semibold text-rose-600">Clear draft</button>
                  </div>
                </div>
              </form>
            </div>

            <div>
              <PreviewPanel />
            </div>
          </div>
        </FormProvider>
      </ToastProvider>
    </div>
  );
}

function extractForStep(values: any, stepIndex: number) {
  switch (stepIndex) {
    case 0:
      return {
        companyName: values.companyName,
        branchName: values.branchName,
        companyAddress: values.companyAddress,
        phone: values.phone,
        email: values.email,
        website: values.website,
      };
    case 1:
      return {
        receiptNumber: values.receiptNumber,
        referenceNumber: values.referenceNumber,
        date: values.date,
        currency: values.currency,
        paymentPurpose: values.paymentPurpose,
      };
    case 2:
      return {
        customerName: values.customerName,
        customerEmail: values.customerEmail,
        gender: values.gender,
        nationality: values.nationality,
        dateOfBirth: values.dateOfBirth,
      };
    case 3:
      return {
        amount: values.amount,
        paidAmount: values.paidAmount,
        paymentType: values.paymentType,
        chequeNumber: values.chequeNumber,
      };
    case 4:
      return {
        notes: values.notes,
        terms: values.terms,
        receivedBy: values.receivedBy,
        designation: values.designation,
      };
    default:
      return {};
  }
}

function schemaForStep(stepIndex: number): z.ZodTypeAny {
  switch (stepIndex) {
    case 0:
      return require('@/features/receipts/schema').companyInfoSchema;
    case 1:
      return require('@/features/receipts/schema').receiptInfoSchema;
    case 2:
      return require('@/features/receipts/schema').customerInfoSchema;
    case 3:
      return require('@/features/receipts/schema').paymentInfoSchema;
    case 4:
      return require('@/features/receipts/schema').additionalInfoSchema;
    default:
      return receiptSchema;
  }
}
