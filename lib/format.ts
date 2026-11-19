// "2026-07-02T00:00:00.000Z" -> "02 Jul 2026"
export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// 25200 -> "BDT 25,200"
export function formatMoney(amount: number, currency = 'BDT'): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

// "partially_paid" -> "Partially Paid"
export function labelize(text: string): string {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
