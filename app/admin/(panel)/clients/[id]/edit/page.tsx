'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import ClientForm, { ClientFormValues } from '@/components/admin/ClientForm';
import type { Client, ClientResponse } from '@/types/client';

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api<ClientResponse>(`/clients/${id}`);
        setClient(res.client);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load client');
      }
    }
    load();
  }, [id]);

  async function handleUpdate(values: ClientFormValues) {
    await api<ClientResponse>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    });
    router.push(`/admin/clients/${id}`);
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!client) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Edit Client</h1>
      <ClientForm
        initial={client}
        submitLabel="Save changes"
        cancelHref={`/admin/clients/${id}`}
        onSubmit={handleUpdate}
      />
    </main>
  );
}
