'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney, labelize } from '@/lib/format';
import { PAYMENT_METHODS } from '@/types/payment';
import type { PaymentListResponse, PaymentRow } from '@/types/payment';
import type { Client, ClientListResponse, Pagination } from '@/types/client';

const TYPE_LABEL: Record<string, string> = { reversed: 'Reversed', reversal: 'Reversal' };

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [netTotal, setNetTotal] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [clientId, setClientId] = useState('');
  const [method, setMethod] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api<ClientListResponse>('/clients?limit=100')
      .then((res) => setClients(res.data))
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (clientId) params.set('clientId', clientId);
      if (method) params.set('method', method);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      const res = await api<PaymentListResponse>(`/payments?${params.toString()}`);
      setPayments(res.data);
      setPagination(res.pagination);
      setNetTotal(res.summary.netTotal);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load payments');
    } finally {
      setLoading(false);
    }
  }, [page, clientId, method, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReverse(payment: PaymentRow) {
    const note = window.prompt(
      `Reverse the payment of ${formatMoney(payment.amount, payment.currency)} for ${payment.invoiceNumber}? Type a reason (optional) and press OK.`,
      ''
    );
    if (note === null) return;
    setError('');
    try {
      await api(`/payments/${payment._id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reverse the payment');
    }
  }

  function filterChange(setter: (value: string) => void) {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setPage(1);
      setter(e.target.value);
    };
  }

  const SELECT = 'rounded border border-gray-300 px-3 py-2 text-sm';

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <Link
          href="/admin/payments/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Payment
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <select value={clientId} onChange={filterChange(setClientId)} aria-label="Filter by client" className={SELECT}>
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
        <select value={method} onChange={filterChange(setMethod)} aria-label="Filter by method" className={SELECT}>
          <option value="">All methods</option>
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {labelize(m)}
            </option>
          ))}
        </select>
        <label className="text-xs text-gray-500">
          From
          <input type="date" value={from} onChange={filterChange(setFrom)} className={`${SELECT} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-500">
          To
          <input type="date" value={to} onChange={filterChange(setTo)} className={`${SELECT} mt-1 block`} />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-4 text-sm text-gray-700">
        Net received (after reversals): <span className="font-semibold">{formatMoney(netTotal)}</span>
      </p>

      <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No payments found.
                </td>
              </tr>
            )}
            {!loading &&
              payments.map((payment) => (
                <tr key={payment._id} className="border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(payment.paymentDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/invoices/${payment.invoiceId}`} className="hover:underline">
                      {payment.invoiceNumber || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {payment.clientName || '—'}
                    <p className="text-xs text-gray-500">{payment.projectName}</p>
                  </td>
                  <td className="px-4 py-3">{labelize(payment.method)}</td>
                  <td className="px-4 py-3">{payment.reference || '—'}</td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right ${
                      payment.type === 'reversed' ? 'text-gray-400 line-through' : ''
                    }`}
                  >
                    {formatMoney(payment.amount, payment.currency)}
                    {TYPE_LABEL[payment.type] && (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 no-underline">
                        {TYPE_LABEL[payment.type]}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    {payment.type === 'payment' && (
                      <>
                        <Link href={`/admin/payments/${payment._id}/edit`} className="mr-3 hover:underline">
                          Edit
                        </Link>
                        <button onClick={() => handleReverse(payment)} className="text-red-700 hover:underline">
                          Reverse
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} entries)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-gray-300 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
