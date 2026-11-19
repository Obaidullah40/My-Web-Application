'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney, labelize } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';
import type { ClientDetailResponse } from '@/types/client';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">{children}</div>
    </section>
  );
}

const TH = 'px-4 py-3';
const TD = 'px-4 py-3';
const THEAD = 'border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500';

export default function ClientDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ClientDetailResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setData(await api<ClientDetailResponse>(`/clients/${id}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load client');
      }
    }
    load();
  }, [id]);

  async function handleDelete() {
    if (!data) return;
    if (!window.confirm(`Delete client ${data.client.name}? This cannot be undone.`)) return;
    try {
      await api(`/clients/${id}`, { method: 'DELETE' });
      router.push('/admin/clients');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete client');
    }
  }

  if (!data) {
    return error ? (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    ) : (
      <p className="text-gray-500">Loading...</p>
    );
  }

  const { client, projects, invoices, payments, summary } = data;

  return (
    <main>
      <Link href="/admin/clients" className="text-sm text-gray-500 hover:underline">
        Back to clients
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          {client.company && <p className="text-gray-600">{client.company}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={client.status} />
          <Link
            href={`/admin/clients/${client._id}/edit`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-4 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
        <p>
          <span className="text-gray-500">Email: </span>
          {client.email || '—'}
        </p>
        <p>
          <span className="text-gray-500">Phone: </span>
          {client.phone || '—'}
        </p>
        <p>
          <span className="text-gray-500">Website: </span>
          {client.website || '—'}
        </p>
        <p>
          <span className="text-gray-500">Created: </span>
          {formatDate(client.createdAt)}
        </p>
        <p className="sm:col-span-2">
          <span className="text-gray-500">Address: </span>
          {client.address || '—'}
        </p>
        <p className="sm:col-span-2">
          <span className="text-gray-500">Notes: </span>
          {client.notes || '—'}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total invoiced</p>
          <p className="mt-1 text-lg font-semibold">
            {formatMoney(summary.totalInvoiced, summary.currency)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Total paid</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(summary.totalPaid, summary.currency)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase text-gray-500">Outstanding</p>
          <p className="mt-1 text-lg font-semibold">
            {formatMoney(summary.totalOutstanding, summary.currency)}
          </p>
        </div>
      </div>

      <Section title="Projects">
        <table className="w-full text-left text-sm">
          <thead className={THEAD}>
            <tr>
              <th className={TH}>Project</th>
              <th className={TH}>Status</th>
              <th className={TH}>Budget</th>
              <th className={TH}>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No projects yet.
                </td>
              </tr>
            )}
            {projects.map((project) => (
              <tr key={project._id} className="border-b border-gray-100 last:border-0">
                <td className={TD}>{project.name}</td>
                <td className={TD}>
                  <StatusBadge status={project.status} />
                </td>
                <td className={TD}>{formatMoney(project.budget)}</td>
                <td className={TD}>{formatDate(project.deadline)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Invoices">
        <table className="w-full text-left text-sm">
          <thead className={THEAD}>
            <tr>
              <th className={TH}>Invoice</th>
              <th className={TH}>Project</th>
              <th className={TH}>Issued</th>
              <th className={TH}>Total</th>
              <th className={TH}>Paid</th>
              <th className={TH}>Balance</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No invoices yet.
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice._id} className="border-b border-gray-100 last:border-0">
                <td className={TD}>{invoice.invoiceNumber}</td>
                <td className={TD}>{invoice.projectName || '—'}</td>
                <td className={TD}>{formatDate(invoice.issueDate)}</td>
                <td className={TD}>{formatMoney(invoice.total, invoice.currency)}</td>
                <td className={TD}>{formatMoney(invoice.totalPaid, invoice.currency)}</td>
                <td className={TD}>{formatMoney(invoice.balanceDue, invoice.currency)}</td>
                <td className={TD}>
                  <StatusBadge status={invoice.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Payment history">
        <table className="w-full text-left text-sm">
          <thead className={THEAD}>
            <tr>
              <th className={TH}>Date</th>
              <th className={TH}>Invoice</th>
              <th className={TH}>Method</th>
              <th className={TH}>Reference</th>
              <th className={TH}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No payments yet.
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr key={payment._id} className="border-b border-gray-100 last:border-0">
                <td className={TD}>{formatDate(payment.paymentDate)}</td>
                <td className={TD}>{payment.invoiceNumber || '—'}</td>
                <td className={TD}>{labelize(payment.method)}</td>
                <td className={TD}>{payment.reference || '—'}</td>
                <td className={TD}>{formatMoney(payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </main>
  );
}
