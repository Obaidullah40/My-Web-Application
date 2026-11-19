'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Settings, SettingsResponse } from '@/types/settings';

const INPUT = 'w-full rounded border border-gray-300 px-3 py-2 text-sm';
const DEFAULT_COLOR = '#1e40af';
const MAX_LOGO_CHARS = 500000; // the server accepts up to 600000

const EMPTY: Settings = {
  businessName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  paymentInstructions: '',
  footerText: '',
  logo: '',
  brandColor: '',
};

// Shrinks the chosen picture so it stays small, and keeps transparency (PNG).
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      reject(new Error('Please choose a PNG, JPG or WebP image'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      for (const maxSide of [400, 300, 200]) {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not read the image'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length <= MAX_LOGO_CHARS) {
          resolve(dataUrl);
          return;
        }
      }
      reject(new Error('This image is too detailed. Please use a simpler or smaller logo.'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read the image'));
    };
    img.src = url;
  });
}

export default function SettingsPage() {
  const [values, setValues] = useState<Settings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api<SettingsResponse>('/settings');
        setValues(res.settings);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function set<K extends keyof Settings>(key: K, value: string) {
    setSaved(false);
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    try {
      set('logo', await resizeImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the image');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const res = await api<SettingsResponse>('/settings', {
        method: 'PUT',
        body: JSON.stringify(values),
      });
      setValues(res.settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Settings</h1>
      <p className="mb-4 text-sm text-gray-600">These details are printed on your invoices.</p>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-5">
        {error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="rounded bg-green-50 px-3 py-2 text-sm text-green-800">
            Settings saved.
          </p>
        )}

        <h2 className="text-lg font-semibold">Business profile</h2>

        <div>
          <label htmlFor="businessName" className="mb-1 block text-sm font-medium">
            Business name
          </label>
          <input
            id="businessName"
            value={values.businessName}
            onChange={(e) => set('businessName', e.target.value)}
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

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium">
              Phone
            </label>
            <input id="phone" value={values.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT} />
          </div>
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
        </div>

        <h2 className="pt-2 text-lg font-semibold">Invoice design</h2>

        <div>
          <p className="mb-1 text-sm font-medium">Logo</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded border border-gray-200 bg-gray-50">
              {values.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.logo} alt="Logo preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-gray-400">No logo</span>
              )}
            </div>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleLogoFile}
                aria-label="Choose logo image"
                className="block text-sm"
              />
              {values.logo && (
                <button type="button" onClick={() => set('logo', '')} className="text-sm text-red-700 underline">
                  Remove logo
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG or WebP. A PNG with a transparent background looks best. It is shrunk automatically. Click Save
            settings after choosing.
          </p>
        </div>

        <div>
          <label htmlFor="brandColor" className="mb-1 block text-sm font-medium">
            Main colour
          </label>
          <div className="flex items-center gap-3">
            <input
              id="brandColor"
              type="color"
              value={values.brandColor || DEFAULT_COLOR}
              onChange={(e) => set('brandColor', e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-gray-300"
            />
            <span className="text-sm text-gray-600">{values.brandColor || `${DEFAULT_COLOR} (default)`}</span>
            {values.brandColor && (
              <button type="button" onClick={() => set('brandColor', '')} className="text-sm underline">
                Use default
              </button>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="paymentInstructions" className="mb-1 block text-sm font-medium">
            Payment instructions
          </label>
          <textarea
            id="paymentInstructions"
            rows={3}
            value={values.paymentInstructions}
            onChange={(e) => set('paymentInstructions', e.target.value)}
            placeholder="Bank account, bKash or Nagad number, and how clients should pay"
            className={INPUT}
          />
        </div>

        <div>
          <label htmlFor="footerText" className="mb-1 block text-sm font-medium">
            Footer text
          </label>
          <input
            id="footerText"
            value={values.footerText}
            onChange={(e) => set('footerText', e.target.value)}
            placeholder="Thank you for your business"
            className={INPUT}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </main>
  );
}
