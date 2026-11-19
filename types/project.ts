import type { Pagination, ClientInvoice, ClientPayment } from '@/types/client';

export const PROJECT_STATUSES = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface Project {
  _id: string;
  name: string;
  clientId: string;
  description?: string;
  startDate?: string | null;
  deadline?: string | null;
  completionDate?: string | null;
  status: ProjectStatus;
  budget: number;
  technologies: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectClient {
  _id: string;
  name: string;
  company?: string;
}

export interface ProjectListItem extends Project {
  client: ProjectClient | null;
}

export interface ProjectListResponse {
  success: boolean;
  data: ProjectListItem[];
  pagination: Pagination;
}

export interface ProjectResponse {
  success: boolean;
  project: Project;
}

export interface ProjectDetailResponse {
  success: boolean;
  project: Project;
  client: ProjectClient | null;
  invoices: ClientInvoice[];
  payments: ClientPayment[];
  summary: {
    currency: string;
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
  };
}

// What the form sends to the server
export interface ProjectPayload {
  clientId: string;
  name: string;
  status: ProjectStatus;
  description: string;
  startDate: string;
  deadline: string;
  completionDate: string;
  budget: number;
  technologies: string[];
  notes: string;
}
