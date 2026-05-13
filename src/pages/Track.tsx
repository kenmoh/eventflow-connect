import SiteLayout from '@/components/SiteLayout';
import { useStoreBase, fmt } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import type { Booking, BookingStatus, BookingLine } from '@/lib/types';
import { trackSchema } from '@/lib/validation';

type Filter = { status: 'all' | BookingStatus; type: 'all' | 'rental' | 'reservation' };

export default function Track() {
  const bookings = useStoreBase(s => s.bookings);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({ status: 'all', type: 'all' });

  const search = (val: string) => {
    setError('');
    const parsed = trackSchema.safeParse({ query: val });
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    const v = parsed.data.query.toLowerCase();
    const matches = bookings.filter(b =>
      b.reference.toLowerCase() === v || b.customer.email.toLowerCase() === v
    );
    setResults(matches);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) { setQ(ref); search(ref); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!results) return null;
    return results.filter(b =>
      (filter.status === 'all' || b.fulfillment === filter.status) &&
      (filter.type === 'all' || b.type === filter.type),
    );
  }, [results, filter]);

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Track</div>
          <h1 className="font-display text-6xl md:text-7xl">Find any booking.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Enter the email used at checkout to see all your bookings, or your booking reference for one specific order.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <form onSubmit={e => { e.preventDefault(); search(q); }} className="flex gap-2 max-w-2xl">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="email@domain.com  or  ABC-XXXX-XXXX"
            className="flex-1 field"/>
          <button className="bg-gold text-ink px-6 text-xs uppercase tracking-[0.3em] hover:bg-gold/90">Find</button>
        </form>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        {results && results.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Filter</span>
            <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value as Filter['status'] }))} className="field max-w-[180px]">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value as Filter['type'] }))} className="field max-w-[180px]">
              <option value="all">All types</option>
              <option value="reservation">Reservations</option>
              <option value="rental">Rentals</option>
            </select>
            <span className="text-xs text-muted-foreground">{filtered?.length} result{filtered?.length === 1 ? '' : 's'}</span>
          </div>
        )}

        <div className="mt-10 space-y-6">
          {results === null && <p className="text-muted-foreground text-sm">Awaiting input.</p>}
          {results !== null && results.length === 0 && <p className="text-muted-foreground">No bookings found.</p>}
          {filtered?.map(b => <BookingCard key={b.reference} b={b} />)}
        </div>
      </section>
    </SiteLayout>
  );
}

export function BookingCard({ b }: { b: Booking }) {
  return (
    <article className="border border-border bg-card p-3 sm:p-4 lg:p-6">
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
      </div>
    </article>
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
