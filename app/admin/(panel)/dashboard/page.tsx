'use client';

import Link from 'next/link';
import { useAdmin } from '@/components/admin/AuthProvider';

export default function AdminDashboardPage() {
  const { user } = useAdmin();

  return (
    <main>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-gray-700">Welcome, {user.name}.</p>
      <p className="mt-1 text-sm text-gray-500">
        Business statistics will appear here in a later phase.
      </p>

      <div className="mt-6">
        <Link
          href="/admin/clients/new"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Client
        </Link>
      </div>
    </main>
  );
}
