import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, inputCls } from './_shared';
import type { BookingStatus, PaymentStatus, BookingLine } from '@/lib/types';

export default function AdminBookings() {
  const bookings = useStoreBase(s => s.bookings);
  const updateBooking = useStoreBase(s => s.updateBooking);
  return (
    <AdminPage title="Bookings" subtitle="Items shown as pills. Update fulfilment and payment status inline.">
      {bookings.length === 0 && <p className="text-muted-foreground">No bookings yet.</p>}
      <div className="space-y-4">
        {bookings.map(b => (
          <article key={b.reference} className="border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="chip">{b.type}</span>
              <span className="font-display text-2xl">{b.reference}</span>
              <span className="chip">{b.fulfillment}</span>
              <span className="chip-gold chip">{b.paymentStatus}</span>
              <span className="ml-auto text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString()}</span>
            </div>

            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
              <Detail k="Name" v={b.customer.name}/>
              <Detail k="Email" v={b.customer.email}/>
              <Detail k="Phone" v={b.customer.phone}/>
              <Detail k="Date" v={String((b.details as { date?: string }).date ?? '—')}/>
              {(b.details as { hotel?: string }).hotel && <Detail k="Hotel" v={String((b.details as { hotel?: string }).hotel)}/>}
              {(b.details as { address?: string }).address && <Detail k="Address" v={String((b.details as { address?: string }).address)}/>}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Items</div>
              {b.lines && b.lines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {b.lines.map((l, i) => <LinePill key={i} l={l}/>)}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Legacy booking — see raw details: {JSON.stringify(b.details)}</p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 items-end border-t border-border pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</div>
                <div className="font-display text-xl">{fmt(b.total)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Paid / Balance</div>
                <div className="font-display text-xl">{fmt(b.amountPaid)} <span className="text-gold text-sm">/ {fmt(b.balanceDue)}</span></div>
              </div>
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
          </article>
        ))}
      </div>
      {bookings.length > 0 && <p className="mt-10 text-xs text-muted-foreground">Total volume: {fmt(bookings.reduce((a, b) => a + b.total, 0))}</p>}
    </AdminPage>
  );
}

function LinePill({ l }: { l: BookingLine }) {
  const accent = l.kind === 'package' ? 'chip-gold' : '';
  let label = '';
  if (l.kind === 'room') label = `Room · ${l.name} · ${l.nights}n · ${fmt(l.subtotal)}`;
  if (l.kind === 'hall') label = `Hall · ${l.name} · ${l.days}d${l.timeSlot ? ` · ${l.timeSlot}` : ''}${l.seatArrangement ? ` · ${l.seatArrangement}` : ''} · ${fmt(l.subtotal)}`;
  if (l.kind === 'package') label = `Package · ${l.name} · ${l.persons} pax${l.timeSlot ? ` · ${l.timeSlot}` : ''} · ${fmt(l.subtotal)}`;
  if (l.kind === 'rental') label = `Rental · ${l.name} · ${l.quantity}× · ${l.days}d · ${fmt(l.subtotal)}`;
  return <span className={`chip ${accent}`}>{label}</span>;
}

function Detail({ k, v }: { k: string; v: string }) {
  return <div><span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block">{k}</span><span className="text-foreground/90">{v}</span></div>;
}
