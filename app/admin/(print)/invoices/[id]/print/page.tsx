'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { formatDate, formatMoney, labelize } from '@/lib/format';
import type { InvoiceDetailResponse } from '@/types/invoice';
import type { Settings, SettingsResponse } from '@/types/settings';

const DEFAULT_BRAND = '#1e40af';

// What the client sees as payment status on the printed invoice.
const STATUS_TEXT: Record<string, string> = {
  draft: 'DRAFT',
  sent: 'UNPAID',
  unpaid: 'UNPAID',
  partially_paid: 'PARTIALLY PAID',
  paid: 'PAID',
  overdue: 'OVERDUE',
  cancelled: 'CANCELLED',
};

const STATUS_COLOR: Record<string, string> = {
  draft: '#6b7280',
  sent: '#c2410c',
  unpaid: '#c2410c',
  partially_paid: '#b45309',
  paid: '#15803d',
  overdue: '#b91c1c',
  cancelled: '#6b7280',
};

// Makes the browser print background colours exactly as they look on screen.
const PRINT_COLORS = { WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties;

export default function InvoicePrintPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceDetailResponse | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [invoiceRes, settingsRes] = await Promise.all([
          api<InvoiceDetailResponse>(`/invoices/${id}`),
          api<SettingsResponse>('/settings'),
        ]);
        setData(invoiceRes);
        setSettings(settingsRes.settings);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load invoice');
      }
    }
    load();
  }, [id]);

  // The browser uses the page title as the default PDF file name.
  useEffect(() => {
    if (!data) return undefined;
    const previousTitle = document.title;
    document.title = data.invoice.invoiceNumber;
    return () => {
      document.title = previousTitle;
    };
  }, [data]);

  if (error) {
    return (
      <p role="alert" className="m-6 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!data || !settings) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  const { invoice, client, project, totalPaid, balanceDue, status } = data;
  const money = (amount: number) => formatMoney(amount, invoice.currency);

  const brand = /^#[0-9a-fA-F]{6}$/.test(settings.brandColor) ? settings.brandColor : DEFAULT_BRAND;
  const tint = `${brand}14`; // the brand colour at about 8% strength
  const statusColor = STATUS_COLOR[status] || '#374151';

  // The client only sees real payments: reversed ones and their reversal entries are left out.
  const payments = data.payments.filter((p) => !p.reversalOf && !p.reversedAt);

  const hasBusinessDetails =
    Boolean(settings.businessName || settings.email || settings.phone || settings.website || settings.address);
  const footerContacts = [settings.email, settings.phone, settings.website].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-200 print:bg-white">
      <style>{`@page { size: A4; margin: 0; }`}</style>

      <div className="print:hidden">
        <div className="mx-auto flex max-w-[210mm] flex-wrap items-center justify-between gap-2 px-2 py-3">
          <Link href={`/admin/invoices/${invoice._id}`} className="text-sm underline">
            Back to invoice
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
            >
              Print
            </button>
            <button
              onClick={() => window.print()}
              className="rounded border border-gray-900 bg-white px-4 py-2 text-sm font-medium"
            >
              Save as PDF
            </button>
          </div>
        </div>
        <p className="mx-auto max-w-[210mm] px-2 pb-3 text-xs text-gray-600">
          To save a PDF, click Save as PDF and choose Save as PDF as the destination (printer) in the window that
          opens.
        </p>
        {!hasBusinessDetails && (
          <p className="mx-auto mb-3 max-w-[210mm] rounded bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
            Your business details are empty, so they will not appear on the invoice.{' '}
            <Link href="/admin/settings" className="underline">
              Add them in Settings
            </Link>
            .
          </p>
        )}
      </div>

      <div className="overflow-x-auto px-2 pb-8 print:overflow-visible print:p-0">
        <article className="relative mx-auto min-h-[297mm] w-[210mm] bg-white p-[15mm] text-sm text-gray-900 shadow print:m-0 print:shadow-none">
          {/* Faint logo in the middle of the page (repeats on every printed page) */}
          {settings.logo && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center print:fixed"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={settings.logo} alt="" className="w-[110mm] opacity-[0.07]" />
            </div>
          )}

          <div className="relative z-10 flex min-h-[267mm] flex-col">
            {/* Header band */}
            <header
              className="-mx-[15mm] -mt-[15mm] flex items-center justify-between gap-6 px-[15mm] py-6 text-white"
              style={{ background: brand, ...PRINT_COLORS }}
            >
              <div className="flex items-center gap-4">
                {settings.logo && (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
                <div>
                  {settings.businessName && <h1 className="text-xl font-bold">{settings.businessName}</h1>}
                  <div className="mt-0.5 space-y-0.5 text-xs opacity-90">
                    {settings.email && <p>{settings.email}</p>}
                    {settings.phone && <p>{settings.phone}</p>}
                    {settings.website && <p>{settings.website}</p>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold tracking-widest">INVOICE</h2>
                <p className="mt-1 text-sm font-medium">{invoice.invoiceNumber}</p>
              </div>
            </header>

            {/* Dates and status */}
            <section className="mt-5 flex items-end justify-between gap-4">
              <div className="flex gap-8 text-xs">
                <div>
                  <p className="font-semibold uppercase text-gray-500">Issue date</p>
                  <p className="mt-0.5 text-sm font-medium">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="font-semibold uppercase text-gray-500">Due date</p>
                  <p className="mt-0.5 text-sm font-medium">{formatDate(invoice.dueDate)}</p>
                </div>
              </div>
              <p
                className="rounded border-2 px-3 py-1 text-sm font-bold tracking-wide"
                style={{ color: statusColor, borderColor: statusColor }}
              >
                {STATUS_TEXT[status] || labelize(status).toUpperCase()}
              </p>
            </section>

            {/* Bill to / project */}
            <section className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-lg p-4" style={{ background: tint, ...PRINT_COLORS }}>
                <p className="text-xs font-semibold uppercase" style={{ color: brand }}>
                  Bill to
                </p>
                {client ? (
                  <div className="mt-1 space-y-0.5">
                    <p className="font-semibold">{client.name}</p>
                    {client.company && <p>{client.company}</p>}
                    {client.address && <p className="whitespace-pre-line">{client.address}</p>}
                    {client.phone && <p>{client.phone}</p>}
                    {client.email && <p>{client.email}</p>}
                  </div>
                ) : (
                  <p className="mt-1">—</p>
                )}
              </div>
              <div className="rounded-lg p-4" style={{ background: tint, ...PRINT_COLORS }}>
                <p className="text-xs font-semibold uppercase" style={{ color: brand }}>
                  Project
                </p>
                <p className="mt-1 font-semibold">{project ? project.name : '—'}</p>
              </div>
            </section>

            {/* Items */}
            <table className="mt-6 w-full text-left">
              <thead>
                <tr className="text-xs uppercase text-white" style={{ background: brand, ...PRINT_COLORS }}>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2 text-right">Rate</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr
                    key={index}
                    className="break-inside-avoid border-b border-gray-200"
                    style={index % 2 === 1 ? { background: tint, ...PRINT_COLORS } : undefined}
                  >
                    <td className="px-3 py-2">
                      {item.description}
                      {item.usdAmount ? (
                        <p className="text-[10px] text-gray-500">
                          {formatMoney(item.usdAmount, 'USD')} @ {item.exchangeRate} {invoice.currency} per USD
                        </p>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{money(item.rate)}</td>
                    <td className="px-3 py-2 text-right">{money(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <section className="mt-4 ml-auto w-72 space-y-1 break-inside-avoid">
              <p className="flex justify-between px-3">
                <span>Subtotal</span>
                <span>{money(invoice.subtotal)}</span>
              </p>
              {invoice.discount > 0 && (
                <p className="flex justify-between px-3">
                  <span>Discount</span>
                  <span>- {money(invoice.discount)}</span>
                </p>
              )}
              {invoice.additionalCharge > 0 && (
                <p className="flex justify-between px-3">
                  <span>Additional charge</span>
                  <span>{money(invoice.additionalCharge)}</span>
                </p>
              )}
              {invoice.tax > 0 && (
                <p className="flex justify-between px-3">
                  <span>Tax</span>
                  <span>{money(invoice.tax)}</span>
                </p>
              )}
              <p
                className="flex justify-between rounded px-3 py-2 text-base font-bold text-white"
                style={{ background: brand, ...PRINT_COLORS }}
              >
                <span>Grand total</span>
                <span>{money(invoice.total)}</span>
              </p>
            </section>

            {/* Payments */}
            <section className="mt-6 break-inside-avoid">
              <h3 className="mb-2 text-xs font-semibold uppercase" style={{ color: brand }}>
                Payment history
              </h3>
              {payments.length === 0 ? (
                <p className="text-xs text-gray-600">No payments received yet.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="uppercase" style={{ background: tint, color: brand, ...PRINT_COLORS }}>
                      <th className="px-3 py-1.5">Date</th>
                      <th className="px-3 py-1.5">Method</th>
                      <th className="px-3 py-1.5">Reference</th>
                      <th className="px-3 py-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="break-inside-avoid border-b border-gray-200">
                        <td className="px-3 py-1.5">{formatDate(payment.paymentDate)}</td>
                        <td className="px-3 py-1.5">{labelize(payment.method)}</td>
                        <td className="px-3 py-1.5">{payment.reference || '—'}</td>
                        <td className="px-3 py-1.5 text-right">{money(payment.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div className="mt-3 ml-auto w-72 space-y-1">
                <p className="flex justify-between px-3">
                  <span>Total paid</span>
                  <span className="font-medium" style={{ color: '#15803d' }}>
                    {money(totalPaid)}
                  </span>
                </p>
                <p
                  className="flex justify-between rounded border-2 px-3 py-2 text-base font-bold"
                  style={{ borderColor: balanceDue > 0 ? '#b91c1c' : '#15803d', color: balanceDue > 0 ? '#b91c1c' : '#15803d' }}
                >
                  <span>Balance due</span>
                  <span>{money(balanceDue)}</span>
                </p>
              </div>
            </section>

            {/* Instructions, terms, notes */}
            {(settings.paymentInstructions || invoice.terms || invoice.notes) && (
              <section className="mt-6 space-y-3 break-inside-avoid text-xs">
                {settings.paymentInstructions && (
                  <div>
                    <p className="font-semibold uppercase" style={{ color: brand }}>
                      Payment instructions
                    </p>
                    <p className="mt-0.5 whitespace-pre-line">{settings.paymentInstructions}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="font-semibold uppercase" style={{ color: brand }}>
                      Payment terms
                    </p>
                    <p className="mt-0.5 whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
                {invoice.notes && (
                  <div>
                    <p className="font-semibold uppercase" style={{ color: brand }}>
                      Notes
                    </p>
                    <p className="mt-0.5 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
              </section>
            )}

            {/* Footer band, always at the bottom of the page */}
            <footer className="-mx-[15mm] -mb-[15mm] mt-auto break-inside-avoid pt-8">
              <p className="pb-2 text-center text-xs font-medium" style={{ color: brand }}>
                {settings.footerText || 'Thank you for your business.'}
              </p>
              <div
                className="px-[15mm] py-3 text-center text-xs text-white"
                style={{ background: brand, ...PRINT_COLORS }}
              >
                {settings.businessName && <p className="font-semibold">{settings.businessName}</p>}
                {footerContacts.length > 0 && <p className="mt-0.5">{footerContacts.join('   |   ')}</p>}
                {settings.address && <p className="mt-0.5 opacity-90">{settings.address}</p>}
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}
