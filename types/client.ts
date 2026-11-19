export interface Client {
  _id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ClientListResponse {
  success: boolean;
  data: Client[];
  pagination: Pagination;
}

export interface ClientResponse {
  success: boolean;
  client: Client;
}

export interface ClientProject {
  _id: string;
  name: string;
  status: string;
  budget: number;
  deadline?: string;
}

export interface ClientInvoice {
  _id: string;
  invoiceNumber: string;
  projectName: string;
  issueDate: string;
  dueDate?: string;
  currency: string;
  total: number;
  totalPaid: number;
  balanceDue: number;
  status: string;
}

export interface ClientPayment {
  _id: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string;
  reversalOf?: string | null;
  reversedAt?: string | null;
}

export interface ClientDetailResponse {
  success: boolean;
  client: Client;
  projects: ClientProject[];
  invoices: ClientInvoice[];
  payments: ClientPayment[];
  summary: {
    currency: string;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}
