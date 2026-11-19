'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ClientForm, { ClientFormValues } from '@/components/admin/ClientForm';
import type { ClientResponse } from '@/types/client';

export default function NewClientPage() {
  const router = useRouter();

  async function handleCreate(values: ClientFormValues) {
    const res = await api<ClientResponse>('/clients', {
      method: 'POST',
      body: JSON.stringify(values),
    });
    router.push(`/admin/clients/${res.client._id}`);
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Add Client</h1>
      <ClientForm submitLabel="Create client" cancelHref="/admin/clients" onSubmit={handleCreate} />
    </main>
  );
}
