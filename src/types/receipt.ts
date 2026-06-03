export type ReceiptStatus = 'draft' | 'finalized';

export type CompanyData = {
  companyName: string;
  branchName: string;
  companyLogoUrl?: string;
  watermarkUrl?: string;
  companyAddress: string;
  phone: string;
  email: string;
  website: string;
};

export type CustomerData = {
  customerName: string;
  customerEmail?: string;
  gender: string;
  nationality: string;
  fatherName: string;
  dateOfBirth: string;
  university: string;
  course: string;
};

export type PaymentData = {
  amount: number;
  totalAmount: number;
  paidAmount: number;
  amountInWords: string;
  currency: string;
  paymentType: string;
  paymentPurpose: string;
  paymentPeriod: string;
  chequeNumber?: string;
  referenceNumber: string;
  date: string;
};

export type AdditionalData = {
  notes: string;
  terms: string;
  receivedBy: string;
  designation: string;
  signatureUrl?: string;
  stampUrl?: string;
};

export type ReceiptDraft = CompanyData & CustomerData & PaymentData & AdditionalData & {
  id?: string;
  receiptNumber: string;
  templateId?: string;
  status?: ReceiptStatus;
  vendorId?: string;
  pdfId?: string | null;
};

export type ReceiptEntity = {
  id: string;
  vendorId: string;
  receiptNumber: string;
  templateId: string;
  status: ReceiptStatus;
  companyData: CompanyData;
  customerData: CustomerData;
  paymentData: PaymentData;
  additionalData: AdditionalData;
  amount: number;
  currency: string;
  pdfId?: string | null;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string | null;
};

export type ReceiptDbPayload = {
  receipt_number?: string;
  template_id?: string;
  status?: ReceiptStatus;
  company_data?: CompanyData;
  customer_data?: CustomerData;
  payment_data?: PaymentData;
  additional_data?: AdditionalData;
  amount?: number;
  currency?: string;
  pdf_id?: string | null;
};

export function toReceiptDbPayload(draft: ReceiptDraft): ReceiptDbPayload {
  return {
    receipt_number: draft.receiptNumber,
    template_id: draft.templateId,
    status: draft.status,
    company_data: {
      companyName: draft.companyName,
      branchName: draft.branchName,
      companyLogoUrl: draft.companyLogoUrl,
      watermarkUrl: draft.watermarkUrl,
      companyAddress: draft.companyAddress,
      phone: draft.phone,
      email: draft.email,
      website: draft.website,
    },
    customer_data: {
      customerName: draft.customerName,
      customerEmail: draft.customerEmail,
      gender: draft.gender,
      nationality: draft.nationality,
      fatherName: draft.fatherName,
      dateOfBirth: draft.dateOfBirth,
      university: draft.university,
      course: draft.course,
    },
    payment_data: {
      amount: draft.amount,
      totalAmount: draft.totalAmount,
      paidAmount: draft.paidAmount,
      amountInWords: draft.amountInWords,
      currency: draft.currency,
      paymentType: draft.paymentType,
      paymentPurpose: draft.paymentPurpose,
      paymentPeriod: draft.paymentPeriod,
      chequeNumber: draft.chequeNumber,
      referenceNumber: draft.referenceNumber,
      date: draft.date,
    },
    additional_data: {
      notes: draft.notes,
      terms: draft.terms,
      receivedBy: draft.receivedBy,
      designation: draft.designation,
      signatureUrl: draft.signatureUrl,
      stampUrl: draft.stampUrl,
    },
    amount: draft.amount,
    currency: draft.currency,
    pdf_id: draft.pdfId ?? null,
  };
}

export function receiptEntityToDraft(entity: ReceiptEntity): ReceiptDraft {
  return {
    id: entity.id,
    templateId: entity.templateId,
    status: entity.status,
    vendorId: entity.vendorId,
    pdfId: entity.pdfId ?? null,
    receiptNumber: entity.receiptNumber,
    referenceNumber: entity.paymentData.referenceNumber,
    date: entity.paymentData.date,
    companyName: entity.companyData.companyName,
    branchName: entity.companyData.branchName,
    companyLogoUrl: entity.companyData.companyLogoUrl,
    watermarkUrl: entity.companyData.watermarkUrl,
    companyAddress: entity.companyData.companyAddress,
    phone: entity.companyData.phone,
    email: entity.companyData.email,
    website: entity.companyData.website,
    customerName: entity.customerData.customerName,
    customerEmail: entity.customerData.customerEmail,
    gender: entity.customerData.gender,
    nationality: entity.customerData.nationality,
    fatherName: entity.customerData.fatherName,
    dateOfBirth: entity.customerData.dateOfBirth,
    university: entity.customerData.university,
    course: entity.customerData.course,
    amount: entity.paymentData.amount,
    totalAmount: entity.paymentData.totalAmount,
    paidAmount: entity.paymentData.paidAmount,
    amountInWords: entity.paymentData.amountInWords,
    currency: entity.paymentData.currency,
    paymentType: entity.paymentData.paymentType,
    paymentPurpose: entity.paymentData.paymentPurpose,
    paymentPeriod: entity.paymentData.paymentPeriod,
    chequeNumber: entity.paymentData.chequeNumber,
    notes: entity.additionalData.notes,
    terms: entity.additionalData.terms,
    receivedBy: entity.additionalData.receivedBy,
    designation: entity.additionalData.designation,
    signatureUrl: entity.additionalData.signatureUrl,
    stampUrl: entity.additionalData.stampUrl,
  };
}
