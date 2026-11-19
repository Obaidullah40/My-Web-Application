'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatMoney, labelize } from '@/lib/format';
import { PAYMENT_METHODS } from '@/types/payment';
import type { PaymentMethod, PaymentPayload } from '@/types/payment';

interface Props {
  mode: 'create' | 'edit';
  // create: which invoice the payment is for
  invoice?: { _id: string; invoiceNumber: string; currency: string; balanceDue: number };
  // edit: the payment being edited (amount is shown but cannot be changed)
  initial?: { amount: number; currency: string; paymentDate: string; method: PaymentMethod; reference?: string; note?: string };
  onSubmit: (payload: PaymentPayload) => Promise<void>;
  onCancel: () => void;
}

const INPUT = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';
const today = () => new Date().toISOString().slice(0, 10);

export default function PaymentForm({ mode, invoice, initial, onSubmit, onCancel }: Props) {
  const [amount, setAmount] = useState(invoice ? String(invoice.balanceDue) : '');
  const [paymentDate, setPaymentDate] = useState(initial ? initial.paymentDate.slice(0, 10) : today());
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? 'cash');
  const [reference, setReference] = useState(initial?.reference ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (mode === 'create') {
        await onSubmit({
          invoiceId: invoice?._id,
          amount: Number(amount),
          paymentDate,
          method,
          reference,
          note,
        });
      } else {
        await onSubmit({ paymentDate, method, reference, note });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {mode === 'create' && invoice && (
        <p className="text-sm text-gray-700">
          Invoice <span className="font-medium">{invoice.invoiceNumber}</span> | Balance due:{' '}
          <span className="font-medium">{formatMoney(invoice.balanceDue, invoice.currency)}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium">
            Amount {mode === 'create' ? '*' : ''}
          </label>
          {mode === 'create' ? (
            <input
              id="amount"
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={INPUT}
            />
          ) : (
            <>
              <p className="rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                {formatMoney(initial?.amount ?? 0, initial?.currency)}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                The amount cannot be edited. To fix it, reverse this payment and add a new one.
              </p>
            </>
          )}
        </div>
        <div>
          <label htmlFor="paymentDate" className="mb-1 block text-sm font-medium">
            Payment date *
          </label>
          <input
            id="paymentDate"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="method" className="mb-1 block text-sm font-medium">
            Payment method *
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            className={INPUT}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {labelize(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="reference" className="mb-1 block text-sm font-medium">
            Reference number
          </label>
          <input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} className={INPUT} />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium">
          Note
        </label>
        <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : mode === 'create' ? 'Add payment' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
