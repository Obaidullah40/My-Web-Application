'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import PaymentForm from '@/components/admin/PaymentForm';
import type { InvoiceListItem, InvoiceListResponse } from '@/types/invoice';
import type { PaymentPayload, PaymentRowResponse } from '@/types/payment';

export default function NewPaymentPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [invoiceId, setInvoiceId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api<InvoiceListResponse>('/invoices?limit=100');
        // Only invoices that can receive a payment: sent and still money due.
        setInvoices(res.data.filter((i) => i.status !== 'draft' && i.status !== 'cancelled' && i.balanceDue > 0));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load invoices');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const selected = invoices.find((i) => i._id === invoiceId);

  async function handleCreate(payload: PaymentPayload) {
    await api<PaymentRowResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    router.push(`/admin/invoices/${payload.invoiceId}`);
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Add Payment</h1>

      {error && (
        <p role="alert" className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-700">
          No invoices are waiting for a payment. An invoice must be marked as sent and have a balance due.
        </p>
      ) : (
        <>
          <div className="mb-4 max-w-xl">
            <label htmlFor="invoice" className="mb-1 block text-sm font-medium">
              Invoice *
            </label>
            <select
              id="invoice"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select an invoice</option>
              {invoices.map((invoice) => (
                <option key={invoice._id} value={invoice._id}>
                  {invoice.invoiceNumber} - {invoice.clientName} - balance{' '}
                  {formatMoney(invoice.balanceDue, invoice.currency)}
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <PaymentForm
              key={selected._id}
              mode="create"
              invoice={{
                _id: selected._id,
                invoiceNumber: selected.invoiceNumber,
                currency: selected.currency,
                balanceDue: selected.balanceDue,
              }}
              onSubmit={handleCreate}
              onCancel={() => router.push('/admin/payments')}
            />
          )}
        </>
      )}
    </main>
  );
}
