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
          <article key={b.reference} className="border border-border bg-card p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline flex-wrap gap-2 sm:gap-3">
              <span className="chip text-xs">{b.type}</span>
              <span className="font-display text-lg sm:text-2xl">{b.reference}</span>
              <span className="chip text-xs">{b.fulfillment}</span>
              <span className="chip-gold chip text-xs">{b.paymentStatus}</span>
              <span className="text-xs text-muted-foreground sm:ml-auto">{new Date(b.createdAt).toLocaleString()}</span>
            </div>

            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-x-4 lg:gap-x-6 gap-y-3 text-sm">
              <Detail k="Name" v={b.customer.name}/>
              <Detail k="Email" v={b.customer.email}/>
              <Detail k="Phone" v={b.customer.phone}/>
              <Detail k="Date" v={String((b.details as { date?: string }).date ?? '—')}/>
              {(b.details as { hotel?: string }).hotel && <Detail k="Hotel" v={String((b.details as { hotel?: string }).hotel)}/>}
              {(b.details as { address?: string }).address && <Detail k="Address" v={String((b.details as { address?: string }).address)}/>}
            </div>

            <div className="mt-4 border-t border-border pt-3 sm:pt-4 overflow-x-hidden">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Items</div>
              {b.lines && b.lines.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-w-full">
                  {b.lines.map((l, i) => <LinePill key={i} l={l}/>)}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground break-all">Legacy booking — see raw details: {JSON.stringify(b.details)}</p>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-start border-t border-border pt-3 sm:pt-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</div>
                <div className="font-display text-lg sm:text-xl">{fmt(b.total)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Paid / Balance</div>
                <div className="font-display text-lg sm:text-xl">{fmt(b.amountPaid)} <span className="text-gold text-sm">/ {fmt(b.balanceDue)}</span></div>
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
      {bookings.length > 0 && <p className="mt-6 sm:mt-10 text-xs text-muted-foreground">Total volume: {fmt(bookings.reduce((a, b) => a + b.total, 0))}</p>}
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
  return <span className={`chip ${accent} whitespace-nowrap max-w-full`}>{label}</span>;
}

function Detail({ k, v }: { k: string; v: string }) {
  return <div className="min-w-0"><span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block">{k}</span><span className="text-foreground/90 break-all">{v}</span></div>;
}
