import type { Pagination, ClientPayment } from '@/types/client';

// All statuses shown in the app. draft / sent / cancelled are set by hand;
// the others are calculated by the server from payments and the due date.
export const INVOICE_STATUSES = [
  'draft',
  'sent',
  'unpaid',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
] as const;

export type ManualInvoiceStatus = 'draft' | 'sent' | 'cancelled';

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  // Only for items priced in US dollars: rate = usdAmount x exchangeRate
  usdAmount?: number;
  exchangeRate?: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  additionalCharge: number;
  tax: number;
  total: number;
  status: ManualInvoiceStatus; // stored status; the calculated one is returned separately
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListItem {
  _id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectName: string;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  total: number;
  totalPaid: number;
  balanceDue: number;
  status: string;
}

export interface InvoiceListResponse {
  success: boolean;
  data: InvoiceListItem[];
  pagination: Pagination;
}

export interface InvoicePermissions {
  canEdit: boolean;
  canMarkSent: boolean;
  canCancel: boolean;
  canDelete: boolean;
}

export interface InvoiceParty {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface InvoiceDetailResponse {
  success: boolean;
  invoice: Invoice;
  client: InvoiceParty | null;
  project: { _id: string; name: string } | null;
  payments: ClientPayment[];
  totalPaid: number;
  balanceDue: number;
  status: string; // calculated status
  permissions: InvoicePermissions;
}

export interface InvoiceResponse {
  success: boolean;
  invoice: Invoice;
}

// What the form sends to the server (totals are NOT sent; the server calculates them)
export interface InvoicePayload {
  clientId: string;
  projectId: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  items: {
    description: string;
    quantity: number;
    rate?: number; // taka price (items in taka)
    usdAmount?: number; // dollar price (items in dollars)
    exchangeRate?: number; // taka for 1 dollar (items in dollars)
  }[];
  discount: number;
  additionalCharge: number;
  tax: number;
  notes: string;
  terms: string;
  status?: ManualInvoiceStatus;
}
