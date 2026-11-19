'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import type { Client } from '@/types/client';

export interface ClientFormValues {
  name: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes: string;
  status: 'active' | 'inactive';
}

interface Props {
  initial?: Client;
  submitLabel: string;
  cancelHref: string;
  onSubmit: (values: ClientFormValues) => Promise<void>;
}

const INPUT = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';

export default function ClientForm({ initial, submitLabel, cancelHref, onSubmit }: Props) {
  const [values, setValues] = useState<ClientFormValues>({
    name: initial?.name ?? '',
    company: initial?.company ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    website: initial?.website ?? '',
    address: initial?.address ?? '',
    notes: initial?.notes ?? '',
    status: initial?.status ?? 'active',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-5"
    >
      {error && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Client name *
        </label>
        <input
          id="name"
          required
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          className={INPUT}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="company" className="mb-1 block text-sm font-medium">
            Company
          </label>
          <input
            id="company"
            value={values.company}
            onChange={(e) => set('company', e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => set('status', e.target.value as 'active' | 'inactive')}
            className={INPUT}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone
          </label>
          <input
            id="phone"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="website" className="mb-1 block text-sm font-medium">
          Website
        </label>
        <input
          id="website"
          value={values.website}
          onChange={(e) => set('website', e.target.value)}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="address" className="mb-1 block text-sm font-medium">
          Address
        </label>
        <textarea
          id="address"
          rows={2}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          value={values.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={INPUT}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
