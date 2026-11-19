'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import PaymentForm from '@/components/admin/PaymentForm';
import type { PaymentPayload, PaymentRow, PaymentRowResponse } from '@/types/payment';

export default function EditPaymentPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentRow | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await api<PaymentRowResponse>(`/payments/${id}`);
        setPayment(res.payment);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load payment');
      }
    }
    load();
  }, [id]);

  async function handleUpdate(payload: PaymentPayload) {
    await api<PaymentRowResponse>(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    router.push('/admin/payments');
  }

  if (error) {
    return (
      <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!payment) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (payment.type !== 'payment') {
    return <p className="text-gray-700">A reversed payment or a reversal entry cannot be edited.</p>;
  }

  return (
    <main>
      <h1 className="mb-1 text-2xl font-semibold">Edit Payment</h1>
      <p className="mb-4 text-sm text-gray-600">
        Invoice {payment.invoiceNumber} | {payment.clientName}
      </p>
      <PaymentForm
        mode="edit"
        initial={{
          amount: payment.amount,
          currency: payment.currency,
          paymentDate: payment.paymentDate,
          method: payment.method,
          reference: payment.reference,
          note: payment.note,
        }}
        onSubmit={handleUpdate}
        onCancel={() => router.push('/admin/payments')}
      />
    </main>
  );
}
