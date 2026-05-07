import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, inputCls } from './_shared';
import type { BookingStatus, PaymentStatus } from '@/lib/types';
import { BookingCard } from '../Track';

export default function AdminBookings() {
  const bookings = useStoreBase(s => s.bookings);
  const updateBooking = useStoreBase(s => s.updateBooking);
  return (
    <AdminPage title="Bookings" subtitle="Update fulfilment and payment status.">
      {bookings.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
      <div className="space-y-6">
        {bookings.map(b => (
          <div key={b.reference} className="space-y-3">
            <BookingCard b={b} />
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Fulfilment</span>
                <select className={inputCls} value={b.fulfillment} onChange={e => updateBooking(b.reference, { fulfillment: e.target.value as BookingStatus })}>
                  {(['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as BookingStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Payment</span>
                <select className={inputCls} value={b.paymentStatus} onChange={e => updateBooking(b.reference, { paymentStatus: e.target.value as PaymentStatus })}>
                  {(['unpaid', 'deposit', 'paid', 'refunded'] as PaymentStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
      {bookings.length > 0 && <p className="mt-10 text-xs text-muted-foreground">Total volume: {fmt(bookings.reduce((a, b) => a + b.total, 0))}</p>}
    </AdminPage>
  );
}
