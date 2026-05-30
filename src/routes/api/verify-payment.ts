import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/verify-payment')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const { reference } = await request.json() as { reference: string };
          if (!reference) {
            return Response.json({ error: 'Missing reference' }, { status: 400 });
          }

          const secret = process.env.PAYSTACK_SECRET;
          if (!secret) {
            return Response.json({ error: 'Payment verification not configured' }, { status: 500 });
          }

          const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
              Authorization: `Bearer ${secret}`,
              'Content-Type': 'application/json',
            },
          });

          const data = await res.json();
          if (!res.ok) {
            return Response.json({
              success: false,
              status: 'failed',
              amount: 0,
              reference,
              message: data?.message ?? 'Verify request failed',
            });
          }

          return Response.json({
            success: data.data.status === 'success',
            status: data.data.status,
            amount: data.data.amount,
            reference,
            message: data.data.gateway_response,
          });
        } catch (error) {
          console.error('[verify-payment]', error);
          return Response.json({
            success: false,
            status: 'pending',
            amount: 0,
            reference: '',
            message: 'Server error',
          });
        }
      }
    }
  }
});
