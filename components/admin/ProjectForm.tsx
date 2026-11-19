'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { labelize } from '@/lib/format';
import { PROJECT_STATUSES } from '@/types/project';
import type { Project, ProjectPayload, ProjectStatus } from '@/types/project';
import type { Client, ClientListResponse } from '@/types/client';

interface Props {
  initial?: Project;
  clientLocked?: boolean; // true when the project already has invoices
  submitLabel: string;
  cancelHref: string;
  onSubmit: (payload: ProjectPayload) => Promise<void>;
}

const INPUT = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';

// "2026-07-02T00:00:00.000Z" -> "2026-07-02" (what date inputs need)
const toDateInput = (value?: string | null) => (value ? value.slice(0, 10) : '');

export default function ProjectForm({ initial, clientLocked = false, submitLabel, cancelHref, onSubmit }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsError, setClientsError] = useState('');

  const [clientId, setClientId] = useState(initial?.clientId ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'planning');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [startDate, setStartDate] = useState(toDateInput(initial?.startDate));
  const [deadline, setDeadline] = useState(toDateInput(initial?.deadline));
  const [completionDate, setCompletionDate] = useState(toDateInput(initial?.completionDate));
  const [budget, setBudget] = useState(initial ? String(initial.budget) : '');
  const [technologies, setTechnologies] = useState((initial?.technologies ?? []).join(', '));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await api<ClientListResponse>('/clients?limit=100');
        setClients(res.data);
      } catch (err) {
        setClientsError(err instanceof ApiError ? err.message : 'Could not load clients');
      }
    }
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        clientId,
        name,
        status,
        description,
        startDate,
        deadline,
        completionDate,
        budget: budget === '' ? 0 : Number(budget),
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        notes,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Please try again.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      {(error || clientsError) && (
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error || clientsError}
        </p>
      )}

      <div>
        <label htmlFor="clientId" className="mb-1 block text-sm font-medium">
          Client *
        </label>
        <select
          id="clientId"
          required
          disabled={clientLocked}
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
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
        {clientLocked && (
          <p className="mt-1 text-xs text-gray-500">
            The client cannot be changed because this project already has invoices.
          </p>
        )}
        {!clientLocked && clients.length === 0 && !clientsError && (
          <p className="mt-1 text-xs text-gray-500">
            No clients yet. <Link href="/admin/clients/new" className="underline">Add a client first</Link>.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Project name *
          </label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={INPUT}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {labelize(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={INPUT}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium">
            Start date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="deadline" className="mb-1 block text-sm font-medium">
            Deadline
          </label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="completionDate" className="mb-1 block text-sm font-medium">
            Completion date
          </label>
          <input
            id="completionDate"
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="budget" className="mb-1 block text-sm font-medium">
            Budget
          </label>
          <input
            id="budget"
            type="number"
            min="0"
            step="0.01"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="technologies" className="mb-1 block text-sm font-medium">
            Technologies (separate with commas)
          </label>
          <input
            id="technologies"
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="Next.js, Node.js, MongoDB"
            className={INPUT}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium">
          Notes
        </label>
        <textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={INPUT} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
        <Link href={cancelHref} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}
