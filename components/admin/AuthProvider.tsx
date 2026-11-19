'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import type { AdminUser, AuthResponse } from '@/types/auth';

interface AuthContextValue {
  user: AdminUser;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Wraps every admin page: checks the login once, then shows the page.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await api<AuthResponse>('/auth/me');
        setUser(data.user);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Old or invalid cookie: clear it, then go to login.
          await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
          router.replace('/admin/login');
        }
      }
    }
    loadUser();
  }, [router]);

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.push('/admin/login');
  }

  if (!user) {
    return <p className="p-6 text-gray-500">Loading...</p>;
  }

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
}

export function useAdmin(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAdmin must be used inside AuthProvider');
  }
  return ctx;
}
