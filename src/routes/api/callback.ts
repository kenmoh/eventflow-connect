import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/callback')({
  action: async ({ request }: { request: Request }) => {
    try {
      const url = new URL(request.url);
      const reference = url.searchParams.get('reference');
      const trxref = url.searchParams.get('trxref');
      
      if (!reference) {
        return Response.json({ error: 'Missing reference parameter' }, { status: 400 });
      }
      
      // Verify payment with Paystack before redirecting
      const secret = import.meta.env.PAYSTACK_SECRET;
      if (!secret) {
        console.error('PAYSTACK_SECRET not configured');
        return Response.json({ error: 'Payment verification unavailable' }, { status: 500 });
      }

      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data?.status !== 'success') {
        // Payment not verified — redirect to tracking without verified flag
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/track?ref=${reference}`
          }
        });
      }

      // Payment verified successfully
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/track?ref=${reference}&verified=true`
        }
      });
    } catch (error) {
      console.error('Callback processing error:', error);
      return Response.json({ error: 'Callback processing failed' }, { status: 500 });
    }
  }
});
