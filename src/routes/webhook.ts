import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { checkRateLimit, getClientIp } from '@/lib/security';

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
    try {
      // Rate limiting
      const clientIp = getClientIp(request);
      if (!checkRateLimit(`webhook:${clientIp}`, 'webhook')) {
        return Response.json({ error: 'Too many requests' }, { status: 429 });
      }

      const rawBody = await request.text();
      const signature = request.headers.get('x-paystack-signature');
      
      // Verify Paystack webhook signature
      if (!await verifyPaystackSignature(rawBody, signature)) {
        console.error('Invalid webhook signature');
        return Response.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      const body = JSON.parse(rawBody);
      
      // Only process successful charge events
      if (body.event === 'charge.success') {
        const { reference, amount, customer, metadata } = body.data;
        
        // Update booking payment status to 'paid' if it was 'deposit'
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            payment_status: 'paid',
            amount_paid: amount / 100,
            fulfillment: 'processing' 
          })
          .eq('reference', reference)
          .eq('payment_status', 'deposit')
          .select()
          .single();
        
        if (bookingError && bookingError.code !== 'PGRST116') {
          console.error('Failed to update booking payment status:', bookingError);
          return Response.json({ error: 'Failed to update booking' }, { status: 500 });
        }
        
        if (booking) {
          console.log(`Payment verified for booking ${reference}. Amount: ${amount/100} NGN`);
        }
      }
      
      return Response.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Return 500 so Paystack retries failed deliveries
      return Response.json({ error: 'Processing failed' }, { status: 500 });
    }
  }
});
