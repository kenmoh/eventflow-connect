import { useStore, fmt } from '@/lib/store';
import { AdminPage, inputCls } from './_shared';
import type { BookingStatus, PaymentStatus } from '@/lib/types';

export default function AdminBookings() {
  const { store, updateBooking } = useStore();
  return (
    <AdminPage title="Bookings" subtitle="Update fulfilment and payment status.">
      {store.bookings.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
      <div className="space-y-4">
        {store.bookings.map(b => (
          <article key={b.reference} className="border border-border p-5 grid md:grid-cols-[1fr_auto_auto_auto] gap-4 items-start">
            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="font-display text-xl">{b.reference}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{b.type}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">{b.customer.name} · {b.customer.email} · {b.customer.phone}</div>
              <pre className="mt-3 text-xs bg-secondary p-3 overflow-auto whitespace-pre-wrap font-sans max-w-2xl">{JSON.stringify(b.details, null, 2)}</pre>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</div>
              <div className="font-display text-xl">{fmt(b.total)}</div>
              <div className="text-xs text-muted-foreground mt-1">paid {fmt(b.amountPaid)} · bal {fmt(b.balanceDue)}</div>
            </div>
            <select className={inputCls} value={b.fulfillment} onChange={e => updateBooking(b.reference, { fulfillment: e.target.value as BookingStatus })}>
              {(['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as BookingStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
            <select className={inputCls} value={b.paymentStatus} onChange={e => updateBooking(b.reference, { paymentStatus: e.target.value as PaymentStatus })}>
              {(['unpaid', 'deposit', 'paid', 'refunded'] as PaymentStatus[]).map(s => <option key={s}>{s}</option>)}
            </select>
          </article>
        ))}
      </div>
    </AdminPage>
  );
}
