'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import ProjectForm from '@/components/admin/ProjectForm';
import type { ProjectDetailResponse, ProjectPayload, ProjectResponse } from '@/types/project';

export default function EditProjectPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectDetailResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setData(await api<ProjectDetailResponse>(`/projects/${id}`));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load project');
      }
    }
    load();
  }, [id]);

  async function handleUpdate(payload: ProjectPayload) {
    await api<ProjectResponse>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    router.push(`/admin/projects/${id}`);
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Edit Project</h1>
      <ProjectForm
        initial={data.project}
        clientLocked={data.invoices.length > 0}
        submitLabel="Save changes"
        cancelHref={`/admin/projects/${id}`}
        onSubmit={handleUpdate}
      />
    </main>
  );
}
