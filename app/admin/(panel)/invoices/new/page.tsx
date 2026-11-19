'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import InvoiceForm from '@/components/admin/InvoiceForm';
import type { InvoicePayload, InvoiceResponse } from '@/types/invoice';

export default function NewInvoicePage() {
  const router = useRouter();

  async function handleCreate(payload: InvoicePayload) {
    const res = await api<InvoiceResponse>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    router.push(`/admin/invoices/${res.invoice._id}`);
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Create Invoice</h1>
      <InvoiceForm mode="create" cancelHref="/admin/invoices" onSubmit={handleCreate} />
    </main>
  );
}
