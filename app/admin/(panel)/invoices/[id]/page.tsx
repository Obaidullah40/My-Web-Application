'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney, labelize } from '@/lib/format';
import StatusBadge from '@/components/admin/StatusBadge';
import PaymentForm from '@/components/admin/PaymentForm';
import type { InvoiceDetailResponse, InvoiceResponse } from '@/types/invoice';
import type { PaymentPayload, PaymentRowResponse } from '@/types/payment';

const TH = 'px-4 py-3';
const TD = 'px-4 py-3';
const THEAD = 'border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api<InvoiceDetailResponse>(`/invoices/${id}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load invoice');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: 'sent' | 'cancelled', question: string) {
    if (!window.confirm(question)) return;
    setError('');
    try {
      await api<InvoiceResponse>(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the status');
    }
  }

  async function handleDelete() {
    if (!data) return;
    if (!window.confirm(`Delete draft invoice ${data.invoice.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await api(`/invoices/${id}`, { method: 'DELETE' });
      router.push('/admin/invoices');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete invoice');
    }
  }

  async function handleAddPayment(payload: PaymentPayload) {
    await api<PaymentRowResponse>('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setShowPaymentForm(false);
    await load();
  }

  async function handleReverse(paymentId: string, amountText: string) {
    const note = window.prompt(`Reverse the payment of ${amountText}? Type a reason (optional) and press OK.`, '');
    if (note === null) return;
    setError('');
    try {
      await api(`/payments/${paymentId}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reverse the payment');
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

  const { invoice, client, project, payments, totalPaid, balanceDue, status, permissions } = data;
  const money = (amount: number) => formatMoney(amount, invoice.currency);
  const canAddPayment = status !== 'draft' && status !== 'cancelled' && balanceDue > 0;

  return (
    <main>
      <Link href="/admin/invoices" className="text-sm text-gray-500 hover:underline">
        Back to invoices
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice.invoiceNumber}</h1>
          <p className="text-sm text-gray-600">
            Issued {formatDate(invoice.issueDate)} | Due {formatDate(invoice.dueDate)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={status} />
          {canAddPayment && (
            <button
              onClick={() => setShowPaymentForm((open) => !open)}
              className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              Add payment
            </button>
          )}
          <Link
            href={`/admin/invoices/${invoice._id}/print`}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Preview / PDF
          </Link>
          {permissions.canMarkSent && (
            <button
              onClick={() => changeStatus('sent', 'Mark this invoice as sent?')}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Mark as sent
            </button>
          )}
          {permissions.canEdit && (
            <Link
              href={`/admin/invoices/${invoice._id}/edit`}
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Edit
            </Link>
          )}
          {permissions.canCancel && (
            <button
              onClick={() =>
                changeStatus('cancelled', 'Cancel this invoice? A cancelled invoice cannot be changed again.')
              }
              className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Cancel invoice
            </button>
          )}
          {permissions.canDelete && (
            <button
              onClick={handleDelete}
              className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {showPaymentForm && canAddPayment && (
        <div className="mt-4">
          <PaymentForm
            mode="create"
            invoice={{
              _id: invoice._id,
              invoiceNumber: invoice.invoiceNumber,
              currency: invoice.currency,
              balanceDue,
            }}
            onSubmit={handleAddPayment}
            onCancel={() => setShowPaymentForm(false)}
          />
        </div>
      )}

      <div className="mt-4 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-gray-500">Client</p>
          {client ? (
            <>
              <Link href={`/admin/clients/${client._id}`} className="font-medium underline">
                {client.name}
              </Link>
              {client.company && <p>{client.company}</p>}
              {client.email && <p>{client.email}</p>}
              {client.phone && <p>{client.phone}</p>}
              {client.address && <p>{client.address}</p>}
            </>
          ) : (
            <p>—</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-gray-500">Project</p>
          {project ? (
            <Link href={`/admin/projects/${project._id}`} className="font-medium underline">
              {project.name}
            </Link>
          ) : (
            <p>—</p>
          )}
        </div>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Items</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={TH}>Description</th>
                <th className={`${TH} text-right`}>Qty</th>
                <th className={`${TH} text-right`}>Rate</th>
                <th className={`${TH} text-right`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className={TD}>
                    {item.description}
                    {item.usdAmount ? (
                      <p className="text-xs text-gray-500">
                        {formatMoney(item.usdAmount, 'USD')} x {item.exchangeRate} {invoice.currency} per USD
                      </p>
                    ) : null}
                  </td>
                  <td className={`${TD} text-right`}>{item.quantity}</td>
                  <td className={`${TD} text-right`}>{money(item.rate)}</td>
                  <td className={`${TD} text-right`}>{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <p className="flex justify-between">
            <span>Subtotal</span>
            <span>{money(invoice.subtotal)}</span>
          </p>
          {invoice.discount > 0 && (
            <p className="flex justify-between">
              <span>Discount</span>
              <span>- {money(invoice.discount)}</span>
            </p>
          )}
          {invoice.additionalCharge > 0 && (
            <p className="flex justify-between">
              <span>Additional charge</span>
              <span>{money(invoice.additionalCharge)}</span>
            </p>
          )}
          {invoice.tax > 0 && (
            <p className="flex justify-between">
              <span>Tax</span>
              <span>{money(invoice.tax)}</span>
            </p>
          )}
          <p className="flex justify-between border-t border-gray-300 pt-1 font-semibold">
            <span>Grand total</span>
            <span>{money(invoice.total)}</span>
          </p>
          <p className="flex justify-between">
            <span>Total paid</span>
            <span>{money(totalPaid)}</span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>Balance due</span>
            <span>{money(balanceDue)}</span>
          </p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-lg font-semibold">Payment history</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className={THEAD}>
              <tr>
                <th className={TH}>Date</th>
                <th className={TH}>Method</th>
                <th className={TH}>Reference</th>
                <th className={`${TH} text-right`}>Amount</th>
                <th className={`${TH} text-right`}>Actions</th>
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
              {payments.map((payment) => {
                const isReversal = Boolean(payment.reversalOf);
                const isReversed = Boolean(payment.reversedAt) && !isReversal;
                return (
                  <tr key={payment._id} className="border-b border-gray-100 last:border-0">
                    <td className={TD}>{formatDate(payment.paymentDate)}</td>
                    <td className={TD}>{labelize(payment.method)}</td>
                    <td className={TD}>{payment.reference || '—'}</td>
                    <td className={`${TD} text-right ${isReversed ? 'text-gray-400 line-through' : ''}`}>
                      {money(payment.amount)}
                      {isReversal && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 no-underline">
                          Reversal
                        </span>
                      )}
                      {isReversed && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 no-underline">
                          Reversed
                        </span>
                      )}
                    </td>
                    <td className={`${TD} text-right`}>
                      {!isReversal && !isReversed && (
                        <>
                          <Link href={`/admin/payments/${payment._id}/edit`} className="mr-3 hover:underline">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleReverse(payment._id, money(payment.amount))}
                            className="text-red-700 hover:underline"
                          >
                            Reverse
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <p className="flex justify-between">
            <span>Total paid</span>
            <span>{money(totalPaid)}</span>
          </p>
          <p className="flex justify-between font-semibold">
            <span>Balance due</span>
            <span>{money(balanceDue)}</span>
          </p>
        </div>
      </section>

      {(invoice.notes || invoice.terms) && (
        <div className="mt-6 grid gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-gray-500">Notes</p>
            <p>{invoice.notes || '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">Payment terms</p>
            <p>{invoice.terms || '—'}</p>
          </div>
        </div>
      )}
    </main>
  );
}
