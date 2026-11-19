'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProjectForm from '@/components/admin/ProjectForm';
import type { ProjectPayload, ProjectResponse } from '@/types/project';

export default function NewProjectPage() {
  const router = useRouter();

  async function handleCreate(payload: ProjectPayload) {
    const res = await api<ProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    router.push(`/admin/projects/${res.project._id}`);
  }

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Add Project</h1>
      <ProjectForm submitLabel="Create project" cancelHref="/admin/projects" onSubmit={handleCreate} />
    </main>
  );
}
