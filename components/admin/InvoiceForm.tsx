'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { Invoice, InvoiceListResponse, InvoicePayload } from '@/types/invoice';
import type { Client, ClientListResponse } from '@/types/client';
import type { ProjectListItem, ProjectListResponse } from '@/types/project';

interface Props {
  mode: 'create' | 'edit';
  initial?: Invoice;
  lockParties?: boolean; // true when the invoice already has payments
  cancelHref: string;
  onSubmit: (payload: InvoicePayload) => Promise<void>;
}

// project: added automatically from the project price | service: extra service | custom: typed by hand
interface ItemRow {
  kind: 'project' | 'service' | 'custom';
  description: string;
  quantity: string;
  rate: string; // taka price per unit (when not priced in dollars)
  inUsd: boolean;
  usdAmount: string; // dollar price per unit
  exchangeRate: string; // taka for 1 dollar
}

const INPUT = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';
const SMALL_BUTTON = 'rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50';

const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');
const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (text: string) => {
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
};

const emptyRow = (kind: ItemRow['kind'] = 'custom'): ItemRow => ({
  kind,
  description: '',
  quantity: '1',
  rate: '',
  inUsd: false,
  usdAmount: '',
  exchangeRate: '',
});

const isBlank = (row: ItemRow) => row.kind === 'custom' && !row.description && !row.rate && !row.inUsd;

// Taka price of one unit of an item
const rowRate = (row: ItemRow) => (row.inUsd ? round2(num(row.usdAmount) * num(row.exchangeRate)) : num(row.rate));

export default function InvoiceForm({ mode, initial, lockParties = false, cancelHref, onSubmit }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [projectInvoices, setProjectInvoices] = useState<{ count: number; total: number; currency: string } | null>(
    null
  );

  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [issueDate, setIssueDate] = useState(initial ? toDateInput(initial.issueDate) : today());
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate));
  const [currency, setCurrency] = useState(initial?.currency ?? 'BDT');
  const [items, setItems] = useState<ItemRow[]>(
    initial && initial.items.length > 0
      ? initial.items.map((i) => ({
          kind: 'custom' as const,
          description: i.description,
          quantity: String(i.quantity),
          rate: String(i.rate),
          inUsd: Boolean(i.usdAmount),
          usdAmount: i.usdAmount ? String(i.usdAmount) : '',
          exchangeRate: i.exchangeRate ? String(i.exchangeRate) : '',
        }))
      : [emptyRow()]
  );
  const [discount, setDiscount] = useState(initial ? String(initial.discount) : '');
  const [additionalCharge, setAdditionalCharge] = useState(initial ? String(initial.additionalCharge) : '');
  const [tax, setTax] = useState(initial ? String(initial.tax) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [terms, setTerms] = useState(initial?.terms ?? '');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<ClientListResponse>('/clients?limit=100')
      .then((res) => setClients(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load clients'));
  }, []);

  // Load the projects of the chosen client.
  useEffect(() => {
    if (!clientId) {
      setProjects([]);
      return;
    }
    api<ProjectListResponse>(`/projects?clientId=${clientId}&limit=100`)
      .then((res) => setProjects(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load projects'));
  }, [clientId]);

  // When creating, warn if this project was already invoiced (to avoid billing it twice).
  useEffect(() => {
    if (mode !== 'create' || !projectId) {
      setProjectInvoices(null);
      return;
    }
    api<InvoiceListResponse>(`/invoices?projectId=${projectId}&limit=100`)
      .then((res) => {
        const active = res.data.filter((i) => i.status !== 'cancelled');
        setProjectInvoices(
          active.length > 0
            ? { count: active.length, total: active.reduce((sum, i) => sum + i.total, 0), currency: active[0].currency }
            : null
        );
      })
      .catch(() => setProjectInvoices(null));
  }, [mode, projectId]);

  // Remove the project line (and keep at least one row).
  function withoutProjectRow(rows: ItemRow[]) {
    const rest = rows.filter((row) => row.kind !== 'project');
    return rest.length > 0 ? rest : [emptyRow()];
  }

  function handleClientChange(newClientId: string) {
    setClientId(newClientId);
    setProjectId('');
    if (mode === 'create') setItems((prev) => withoutProjectRow(prev));
  }

  // Choosing a project adds its price as the first invoice item.
  function handleProjectChange(newProjectId: string) {
    setProjectId(newProjectId);
    if (mode !== 'create') return;

    const project = projects.find((p) => p._id === newProjectId);
    setItems((prev) => {
      if (!project) return withoutProjectRow(prev);
      const projectRow: ItemRow = {
        ...emptyRow('project'),
        description: project.name,
        rate: project.budget > 0 ? String(project.budget) : '',
      };
      const others = prev.filter((row) => row.kind !== 'project' && !isBlank(row));
      return [projectRow, ...others];
    });
  }

  function updateItem(index: number, changes: Partial<ItemRow>) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  function lastExchangeRate(rows: ItemRow[]) {
    const withRate = [...rows].reverse().find((row) => row.exchangeRate);
    return withRate ? withRate.exchangeRate : '';
  }

  function toggleUsd(index: number, inUsd: boolean) {
    setItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, inUsd, exchangeRate: row.exchangeRate || lastExchangeRate(prev) } : row
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  // Extra service such as a domain or hosting. Domain and hosting start in dollars.
  function addService(description: string, inUsd: boolean) {
    setItems((prev) => [
      ...prev.filter((row) => !isBlank(row)),
      { ...emptyRow('service'), description, inUsd, exchangeRate: inUsd ? lastExchangeRate(prev) : '' },
    ]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [emptyRow()]));
  }

  // On-screen preview only. The server always calculates the real total.
  const subtotal = round2(items.reduce((sum, row) => sum + round2(num(row.quantity) * rowRate(row)), 0));
  const total = round2(subtotal - num(discount) + num(additionalCharge) + num(tax));

  async function submit(status?: 'draft' | 'sent') {
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        clientId,
        projectId,
        issueDate,
        dueDate,
        currency,
        items: items.map((row) =>
          row.inUsd
            ? {
                description: row.description,
                quantity: Number(row.quantity),
                usdAmount: Number(row.usdAmount),
                exchangeRate: Number(row.exchangeRate),
              }
            : { description: row.description, quantity: Number(row.quantity), rate: Number(row.rate) }
        ),
        discount: discount === '' ? 0 : Number(discount),
        additionalCharge: additionalCharge === '' ? 0 : Number(additionalCharge),
        tax: tax === '' ? 0 : Number(tax),
        notes,
        terms,
        status,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(mode === 'create' ? 'draft' : undefined);
  }

  const selectedProject = projects.find((p) => p._id === projectId);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 rounded-lg border border-gray-200 bg-white p-5">
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientId" className="mb-1 block text-sm font-medium">
            Client *
          </label>
          <select
            id="clientId"
            required
            disabled={lockParties}
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className={INPUT}
          >
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
                {client.company ? ` (${client.company})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="projectId" className="mb-1 block text-sm font-medium">
            Project *
          </label>
          <select
            id="projectId"
            required
            disabled={lockParties || !clientId}
            value={projectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className={INPUT}
          >
            <option value="">{clientId ? 'Select a project' : 'Select a client first'}</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          {clientId && projects.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              This client has no projects.{' '}
              <Link href="/admin/projects/new" className="underline">
                Add a project first
              </Link>
              .
            </p>
          )}
        </div>
      </div>
      {lockParties && (
        <p className="-mt-3 text-xs text-gray-500">
          Client and project cannot be changed because this invoice already has payments.
        </p>
      )}

      {mode === 'create' && selectedProject && (
        <p className="rounded bg-blue-50 px-3 py-2 text-sm text-blue-900">
          The project price ({formatMoney(selectedProject.budget, currency)}) was added as the first item. You can
          change it below.
        </p>
      )}
      {mode === 'create' && projectInvoices && (
        <p className="rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
          This project already has {projectInvoices.count} invoice(s) totalling{' '}
          {formatMoney(projectInvoices.total, projectInvoices.currency)}. Check the amounts so the project is not
          billed twice.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="issueDate" className="mb-1 block text-sm font-medium">
            Issue date *
          </label>
          <input
            id="issueDate"
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="dueDate" className="mb-1 block text-sm font-medium">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="currency" className="mb-1 block text-sm font-medium">
            Currency
          </label>
          <input
            id="currency"
            maxLength={3}
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Invoice items *</p>
        <div className="space-y-3">
          {items.map((row, index) => (
            <div key={index} className="rounded border border-gray-200 p-3">
              <div className="grid grid-cols-12 items-center gap-2">
                <input
                  aria-label={`Item ${index + 1} description`}
                  required
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  className={`${INPUT} col-span-12 sm:col-span-8`}
                />
                <input
                  aria-label={`Item ${index + 1} quantity`}
                  required
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  className={`${INPUT} col-span-8 sm:col-span-3`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  aria-label={`Remove item ${index + 1}`}
                  className="col-span-4 text-sm text-red-700 sm:col-span-1"
                >
                  Remove
                </button>
              </div>

              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.inUsd}
                  onChange={(e) => toggleUsd(index, e.target.checked)}
                />
                Price is in US dollars (convert to {currency})
              </label>

              <div className="mt-2 grid grid-cols-12 items-end gap-2">
                {row.inUsd ? (
                  <>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="mb-1 block text-xs text-gray-600">USD price (each)</label>
                      <input
                        aria-label={`Item ${index + 1} USD price`}
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.usdAmount}
                        onChange={(e) => updateItem(index, { usdAmount: e.target.value })}
                        className={INPUT}
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <label className="mb-1 block text-xs text-gray-600">{currency} for 1 USD (rate)</label>
                      <input
                        aria-label={`Item ${index + 1} exchange rate`}
                        required
                        type="number"
                        min="0"
                        step="0.0001"
                        value={row.exchangeRate}
                        onChange={(e) => updateItem(index, { exchangeRate: e.target.value })}
                        className={INPUT}
                      />
                    </div>
                    <p className="col-span-12 text-sm text-gray-700 sm:col-span-5 sm:text-right">
                      = {formatMoney(rowRate(row), currency)} each
                    </p>
                  </>
                ) : (
                  <div className="col-span-12 sm:col-span-4">
                    <label className="mb-1 block text-xs text-gray-600">Rate ({currency}, each)</label>
                    <input
                      aria-label={`Item ${index + 1} rate`}
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={row.rate}
                      onChange={(e) => updateItem(index, { rate: e.target.value })}
                      className={INPUT}
                    />
                  </div>
                )}
              </div>

              <p className="mt-2 text-right text-sm font-medium">
                Amount: {formatMoney(round2(num(row.quantity) * rowRate(row)), currency)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={addItem} className={SMALL_BUTTON}>
            Add item
          </button>
          <button type="button" onClick={() => addService('Domain registration', true)} className={SMALL_BUTTON}>
            Add domain
          </button>
          <button type="button" onClick={() => addService('Web hosting', true)} className={SMALL_BUTTON}>
            Add hosting
          </button>
          <button type="button" onClick={() => addService('', false)} className={SMALL_BUTTON}>
            Add other service
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="discount" className="mb-1 block text-sm font-medium">
            Discount
          </label>
          <input
            id="discount"
            type="number"
            min="0"
            step="any"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="additionalCharge" className="mb-1 block text-sm font-medium">
            Additional charge
          </label>
          <input
            id="additionalCharge"
            type="number"
            min="0"
            step="any"
            value={additionalCharge}
            onChange={(e) => setAdditionalCharge(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="tax" className="mb-1 block text-sm font-medium">
            Tax (amount)
          </label>
          <input
            id="tax"
            type="number"
            min="0"
            step="any"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="rounded bg-gray-50 p-3 text-sm">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(subtotal, currency)}</span>
        </p>
        <p className="mt-1 flex justify-between font-semibold">
          <span>Estimated total</span>
          <span>{formatMoney(total, currency)}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">The server calculates the final total when you save.</p>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={INPUT} />
      </div>

      <div>
        <label htmlFor="terms" className="mb-1 block text-sm font-medium">
          Payment terms
        </label>
        <textarea id="terms" rows={2} value={terms} onChange={(e) => setTerms(e.target.value)} className={INPUT} />
      </div>

      <div className="flex flex-wrap gap-3">
        {mode === 'create' ? (
          <>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save as draft'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submit('sent')}
              className="rounded border border-gray-900 px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              Save and mark as sent
            </button>
          </>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}
        <Link href={cancelHref} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
