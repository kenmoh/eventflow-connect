const PS_SECRET = import.meta.env.VITE_PAYSTACK_SECRET;

export interface PaystackVerifyResult {
  success: boolean;
  status: 'abandoned' | 'failed' | 'pending' | 'success';
  amount: number; // in kobo
  reference: string;
  message?: string;
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResult> {
  if (!PS_SECRET) {
    console.warn('[paystack] VITE_PAYSTACK_SECRET not set — skipping verify');
    return { success: false, status: 'pending', amount: 0, reference };
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PS_SECRET}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[paystack] verify failed:', res.status, err);
    return { success: false, status: 'pending', amount: 0, reference, message: 'Verify request failed' };
  }

  const json = await res.json();
  const data = json.data;

  return {
    success: data.status === 'success',
    status: data.status,
    amount: data.amount,
    reference,
    message: data.gateway_response,
  };
}