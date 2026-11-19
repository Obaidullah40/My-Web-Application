'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import InvoiceForm from '@/components/admin/InvoiceForm';
import type { InvoiceDetailResponse, InvoicePayload, InvoiceResponse } from '@/types/invoice';

export default function EditInvoicePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setData(await api<InvoiceDetailResponse>(`/invoices/${id}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load invoice');
      }
    }
    load();
  }, [id]);

  async function handleUpdate(payload: InvoicePayload) {
    await api<InvoiceResponse>(`/invoices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    router.push(`/admin/invoices/${id}`);
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!data.permissions.canEdit) {
    return (
      <div>
        <p className="text-gray-700">A cancelled invoice cannot be edited.</p>
        <Link href={`/admin/invoices/${id}`} className="text-sm underline">
          Back to invoice
        </Link>
      </div>
    );
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Edit Invoice {data.invoice.invoiceNumber}</h1>
      <InvoiceForm
        mode="edit"
        initial={data.invoice}
        lockParties={data.payments.length > 0}
        cancelHref={`/admin/invoices/${id}`}
        onSubmit={handleUpdate}
      />
    </main>
  );
}
