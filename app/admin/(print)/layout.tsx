'use client';

import { AuthProvider } from '@/components/admin/AuthProvider';

// The print pages have no sidebar, so the invoice looks clean on paper.
export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
