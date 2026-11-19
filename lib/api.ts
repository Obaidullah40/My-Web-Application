const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// One place for all API calls. credentials: 'include' sends the login cookie.
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Login expired: send the admin back to the login page.
    // (The /auth/* calls handle their own 401, so they are skipped here.)
    if (res.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    throw new ApiError(data.message || 'Something went wrong', res.status);
  }

  return data as T;
}
