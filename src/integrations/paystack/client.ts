export interface PaystackVerifyResult {
  success: boolean;
  status: 'abandoned' | 'failed' | 'pending' | 'success';
  amount: number; // in kobo
  reference: string;
  message?: string;
}

export async function verifyPaystackPayment(reference: string): Promise<PaystackVerifyResult> {
  try {
    const res = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, status: 'pending', amount: 0, reference, message: data?.error ?? 'Verify failed' };
    }

    return data;
  } catch {
    return { success: false, status: 'pending', amount: 0, reference, message: 'Network error' };
  }
}