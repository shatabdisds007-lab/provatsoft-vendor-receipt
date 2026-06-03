import { z } from 'zod';

export const companyInfoSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  branchName: z.string().optional(),
  companyAddress: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  website: z.string().optional(),
});

export const receiptInfoSchema = z.object({
  receiptNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  date: z.string().optional(),
  currency: z.string().min(1, 'Currency is required'),
  paymentPurpose: z.string().optional(),
});

export const customerInfoSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email').optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export const paymentInfoSchema = z.object({
  amount: z.number().min(0, 'Amount must be >= 0'),
  paidAmount: z.number().min(0).optional(),
  paymentType: z.string().optional(),
  chequeNumber: z.string().optional(),
});

export const additionalInfoSchema = z.object({
  notes: z.string().optional(),
  terms: z.string().optional(),
  receivedBy: z.string().optional(),
  designation: z.string().optional(),
});

export const receiptSchema = z.object({
  ...companyInfoSchema.shape,
  ...receiptInfoSchema.shape,
  ...customerInfoSchema.shape,
  ...paymentInfoSchema.shape,
  ...additionalInfoSchema.shape,
});

export type ReceiptSchema = z.infer<typeof receiptSchema>;
