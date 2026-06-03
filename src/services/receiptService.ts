import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { ReceiptDraft, ReceiptEntity, ReceiptStatus, toReceiptDbPayload } from '@/types/receipt';

export type ReceiptFilter = {
  status?: ReceiptStatus;
  receiptNumber?: string;
  templateId?: string;
  latest?: boolean;
};

async function fetchReceiptPdfUrls(receipts: Array<{ pdf_id?: string | null }>) {
  const pdfIds = receipts.filter((item) => item.pdf_id).map((item) => item.pdf_id as string);
  if (pdfIds.length === 0) return {} as Record<string, string>;

  const { data, error } = await supabaseAdmin.from('receipt_pdfs').select('id, pdf_url').in('id', pdfIds);
  if (error || !data) return {} as Record<string, string>;

  return data.reduce((acc: Record<string, string>, item: { id?: string; pdf_url?: string | null }) => {
    if (item.id && item.pdf_url) acc[item.id] = item.pdf_url;
    return acc;
  }, {});
}

type ReceiptRow = {
  id: string;
  vendor_id: string;
  receipt_number: string;
  template_id: string;
  status: ReceiptStatus;
  company_data: any;
  customer_data: any;
  payment_data: any;
  additional_data: any;
  amount: number;
  currency: string;
  pdf_id?: string | null;
  created_at: string;
  updated_at: string;
};

function mapReceiptRowToEntity(row: any, pdfUrlMap: Record<string, string>): ReceiptEntity {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    receiptNumber: row.receipt_number,
    templateId: row.template_id,
    status: row.status,
    companyData: row.company_data || {},
    customerData: row.customer_data || {},
    paymentData: row.payment_data || {},
    additionalData: row.additional_data || {},
    amount: Number(row.amount || 0),
    currency: row.currency || 'INR',
    pdfId: row.pdf_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    pdfUrl: row.pdf_id ? pdfUrlMap[row.pdf_id] || null : null,
  };
}

export async function getNextReceiptNumber() {
  const { data, error } = await supabaseAdmin.rpc('next_receipt_number');
  if (error) {
    throw error;
  }

  return `PS-2026-${String(data).padStart(6, '0')}`;
}

export async function listReceipts(userId: string, isAdmin: boolean, filter: ReceiptFilter = {}) {
  let query = supabaseAdmin.from('receipts').select('*').order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('vendor_id', userId);
  }
  if (filter.status) {
    query = query.eq('status', filter.status);
  }
  if (filter.receiptNumber) {
    query = query.ilike('receipt_number', `%${filter.receiptNumber}%`);
  }
  if (filter.templateId) {
    query = query.eq('template_id', filter.templateId);
  }
  if (filter.latest) {
    query = query.limit(1);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  const receipts = (data || []) as ReceiptRow[];
  const pdfMap = await fetchReceiptPdfUrls(receipts);
  return receipts.map((row) => mapReceiptRowToEntity(row, pdfMap));
}

export async function getReceiptById(userId: string, isAdmin: boolean, receiptId: string) {
  let query = supabaseAdmin.from('receipts').select('*').eq('id', receiptId).limit(1);
  if (!isAdmin) {
    query = query.eq('vendor_id', userId);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return null;
  }

  const pdfMap = await fetchReceiptPdfUrls([row]);
  return mapReceiptRowToEntity(row, pdfMap);
}

export async function createReceipt(userId: string, draft: ReceiptDraft) {
  const payload = toReceiptDbPayload(draft);
  const insertPayload = {
    vendor_id: userId,
    receipt_number: payload.receipt_number || (await getNextReceiptNumber()),
    template_id: payload.template_id || 'default',
    status: payload.status || 'draft',
    company_data: payload.company_data,
    customer_data: payload.customer_data,
    payment_data: payload.payment_data,
    additional_data: payload.additional_data,
    amount: payload.amount,
    currency: payload.currency,
    pdf_id: payload.pdf_id || null,
  };

  const { data, error } = await supabaseAdmin.from('receipts').insert([insertPayload]).select('*').single();
  if (error) {
    throw error;
  }

  const pdfMap = await fetchReceiptPdfUrls([data]);
  return mapReceiptRowToEntity(data, pdfMap);
}

export async function updateReceipt(userId: string, isAdmin: boolean, receiptId: string, draft: Partial<ReceiptDraft>) {
  const existing = await getReceiptById(userId, isAdmin, receiptId);
  if (!existing) {
    throw new Error('Receipt not found');
  }
  if (existing.status === 'finalized') {
    throw new Error('Finalized receipts cannot be edited');
  }

  const payload = toReceiptDbPayload(draft as ReceiptDraft);
  const updatePayload: any = {};

  if (payload.receipt_number) updatePayload.receipt_number = payload.receipt_number;
  if (payload.template_id) updatePayload.template_id = payload.template_id;
  if (payload.status) updatePayload.status = payload.status;
  if (payload.company_data) updatePayload.company_data = payload.company_data;
  if (payload.customer_data) updatePayload.customer_data = payload.customer_data;
  if (payload.payment_data) updatePayload.payment_data = payload.payment_data;
  if (payload.additional_data) updatePayload.additional_data = payload.additional_data;
  if (typeof payload.amount !== 'undefined') updatePayload.amount = payload.amount;
  if (payload.currency) updatePayload.currency = payload.currency;
  if (typeof payload.pdf_id !== 'undefined') updatePayload.pdf_id = payload.pdf_id;
  updatePayload.updated_at = new Date().toISOString();

  const query = supabaseAdmin.from('receipts').update(updatePayload).eq('id', receiptId);
  if (!isAdmin) {
    query.eq('vendor_id', userId);
  }

  const { data, error } = await query.select('*').single();
  if (error) {
    throw error;
  }

  const pdfMap = await fetchReceiptPdfUrls([data]);
  return mapReceiptRowToEntity(data, pdfMap);
}

export async function deleteDraftReceipt(userId: string, isAdmin: boolean, receiptId: string) {
  const existing = await getReceiptById(userId, isAdmin, receiptId);
  if (!existing) {
    throw new Error('Receipt not found');
  }
  if (existing.status !== 'draft') {
    throw new Error('Only draft receipts can be deleted');
  }

  const query = supabaseAdmin.from('receipts').delete().eq('id', receiptId);
  if (!isAdmin) {
    query.eq('vendor_id', userId);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }

  return true;
}

export async function assignReceiptPdf(userId: string, isAdmin: boolean, receiptId: string, pdfId: string) {
  const query = supabaseAdmin.from('receipts').update({ pdf_id: pdfId, updated_at: new Date().toISOString() }).eq('id', receiptId);
  if (!isAdmin) {
    query.eq('vendor_id', userId);
  }

  const { error } = await query;
  if (error) {
    throw error;
  }

  return true;
}
