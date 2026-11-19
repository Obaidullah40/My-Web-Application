import type { Pagination } from '@/types/client';

export const PAYMENT_METHODS = ['cash', 'bank_transfer', 'mobile_banking', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// payment: a normal payment | reversed: it was cancelled | reversal: the cancelling entry
export type PaymentType = 'payment' | 'reversed' | 'reversal';

export interface PaymentRow {
  _id: string;
  invoiceId: string;
  invoiceNumber: string;
  currency: string;
  clientId: string;
  clientName: string;
  projectName: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  note?: string;
  reversalOf?: string | null;
  reversedAt?: string | null;
  type: PaymentType;
  createdAt: string;
}

export interface PaymentListResponse {
  success: boolean;
  data: PaymentRow[];
  pagination: Pagination;
  summary: { netTotal: number };
}

export interface PaymentRowResponse {
  success: boolean;
  payment: PaymentRow;
}

// What the form sends. When editing, only date, method, reference and note are sent.
export interface PaymentPayload {
  invoiceId?: string;
  amount?: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  note: string;
}
