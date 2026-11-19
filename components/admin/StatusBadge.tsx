import { labelize } from '@/lib/format';

const COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  paid: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  draft: 'bg-gray-100 text-gray-700',
  planning: 'bg-blue-100 text-blue-800',
  sent: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  unpaid: 'bg-yellow-100 text-yellow-800',
  partially_paid: 'bg-yellow-100 text-yellow-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {labelize(status)}
    </span>
  );
}
