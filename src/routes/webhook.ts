import { createFileRoute } from '@tanstack/react-router';

async function verifyPaystackSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  
  const secret = import.meta.env.PAYSTACK_SECRET;
  if (!secret) {
    console.error('PAYSTACK_SECRET not configured');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(rawBody);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );

    const mac = await crypto.subtle.sign('HMAC', key, messageData);
    const hashHex = Array.from(new Uint8Array(mac))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return hashHex === signature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

export const Route = createFileRoute('/webhook')({
  action: async ({ request }: { request: Request }) => {
    const { getDb } = await import('@/db/client');
    const { eq } = await import('drizzle-orm');
    const { bookings } = await import('@/db/schema');
    const { checkRateLimit, getClientIp } = await import('@/lib/security');

    try {
      const clientIp = getClientIp(request);
      if (!checkRateLimit(`webhook:${clientIp}`, 'webhook')) {
        return Response.json({ error: 'Too many requests' }, { status: 429 });
      }

      const rawBody = await request.text();
      const signature = request.headers.get('x-paystack-signature');
      
      if (!await verifyPaystackSignature(rawBody, signature)) {
        console.error('Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      const body = JSON.parse(rawBody);
      
      if (body.event === 'charge.success') {
        const { reference, amount } = body.data;
        
        await getDb()
          .update(bookings)
          .set({
            paymentStatus: 'paid',
            amountPaid: amount / 100,
            fulfillment: 'processing',
          })
          .where(eq(bookings.reference, reference))
          .where(eq(bookings.paymentStatus, 'deposit'));

        console.log(`Payment verified for booking ${reference}. Amount: ${amount / 100} NGN`);
      }
      
      return Response.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      return Response.json({ error: 'Processing failed' }, { status: 500 });
    }
  }
});
