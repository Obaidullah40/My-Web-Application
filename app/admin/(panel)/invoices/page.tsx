'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney, labelize } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';
import { INVOICE_STATUSES } from '@/types/invoice';
import type { InvoiceListItem, InvoiceListResponse } from '@/types/invoice';
import type { Client, ClientListResponse, Pagination } from '@/types/client';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [clientId, setClientId] = useState('');
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
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      if (clientId) params.set('clientId', clientId);
      const res = await api<InvoiceListResponse>(`/invoices?${params.toString()}`);
      setInvoices(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load invoices');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, clientId]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          href="/admin/invoices/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Invoice
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mt-4 flex flex-wrap gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search invoice number"
          aria-label="Search invoices"
          className="w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          aria-label="Filter by status"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {labelize(s)}
            </option>
          ))}
        </select>
        <select
          value={clientId}
          onChange={(e) => {
            setPage(1);
            setClientId(e.target.value);
          }}
          aria-label="Filter by client"
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All clients</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Search
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client / Project</th>
              <th className="px-4 py-3">Issued</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Status</th>
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
            {!loading && invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No invoices found.
                </td>
              </tr>
            )}
            {!loading &&
              invoices.map((invoice) => (
                <tr key={invoice._id} className="border-b border-gray-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/invoices/${invoice._id}`} className="font-medium hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.clientName || '—'}
                    <p className="text-xs text-gray-500">{invoice.projectName || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(invoice.issueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(invoice.dueDate)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatMoney(invoice.total, invoice.currency)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {formatMoney(invoice.balanceDue, invoice.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.pages} ({pagination.total} invoices)
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
