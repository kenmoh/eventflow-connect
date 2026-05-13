import SiteLayout from '@/components/SiteLayout';
import { useStoreBase, fmt } from '@/lib/store';
import { useEffect, useMemo, useState } from 'react';
import { useSearch } from '@tanstack/react-router';
import type { Booking, BookingStatus } from '@/lib/types';
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
    <article className="border border-border bg-card p-6 grid md:grid-cols-[1fr_auto] gap-6">
      <div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{b.type}</span>
          <span className="font-display text-2xl">{b.reference}</span>
          <Pill text={b.fulfillment} />
          <Pill text={b.paymentStatus} variant="gold" />
        </div>
        <div className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Detail k="Name" v={b.customer.name}/>
          <Detail k="Email" v={b.customer.email}/>
          <Detail k="Phone" v={b.customer.phone}/>
          <Detail k="Created" v={new Date(b.createdAt).toLocaleString()}/>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Order details</div>
          <DetailsView details={b.details} />
        </div>
      </div>
      <div className="text-right md:border-l md:pl-6 border-border min-w-[180px]">
        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</div>
        <div className="font-display text-3xl">{fmt(b.total)}</div>
        <div className="mt-3 text-sm text-muted-foreground">Paid {fmt(b.amountPaid)}</div>
        <div className="text-sm text-gold">Balance {fmt(b.balanceDue)}</div>
      </div>
    </article>
  );
}

export function DetailsView({ details }: { details: Record<string, unknown> }) {
  return (
    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
      {Object.entries(details).map(([k, v]) => {
        const label = k.charAt(0).toUpperCase() + k.slice(1);
        if (Array.isArray(v)) {
          return (
            <div key={k} className="sm:col-span-2">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
              <ul className="mt-1 space-y-0.5">
                {v.map((it, i) => (
                  <li key={i} className="text-foreground/85">
                    {typeof it === 'object' && it
                      ? Object.entries(it).map(([kk, vv]) => `${kk}: ${vv}`).join(' · ')
                      : String(it)}
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        return <Detail key={k} k={label} v={String(v)} />;
      })}
    </div>
  );
}

function Pill({ text, variant }: { text: string; variant?: 'gold' }) {
  return <span className={`text-[10px] uppercase tracking-[0.3em] px-2 py-1 ${variant === 'gold' ? 'bg-gold text-ink' : 'bg-foreground/10 text-foreground'}`}>{text}</span>;
}
function Detail({ k, v }: { k: string; v: string }) {
  return <div><span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block">{k}</span><span className="text-foreground/90">{v}</span></div>;
}
