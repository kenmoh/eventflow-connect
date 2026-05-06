import SiteLayout from '@/components/SiteLayout';
import { useStore, fmt } from '@/lib/store';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Booking } from '@/lib/types';

export default function Track() {
  const { store } = useStore();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Booking[] | null>(null);

  useEffect(() => {
    const ref = params.get('ref');
    if (ref) { setQ(ref); search(ref); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = (val: string) => {
    const v = val.trim().toLowerCase();
    if (!v) { setResults(null); return; }
    const matches = store.bookings.filter(b =>
      b.reference.toLowerCase() === v || b.customer.email.toLowerCase() === v
    );
    setResults(matches);
  };

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Track</div>
          <h1 className="font-display text-6xl md:text-7xl">Find any booking.</h1>
          <p className="mt-4 text-muted-foreground max-w-xl">Enter the email used at checkout, or your booking reference.</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <form onSubmit={e => { e.preventDefault(); search(q); }} className="flex gap-2 max-w-2xl">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="email@domain.com or SELA-XXXX-XXXX"
            className="flex-1 bg-transparent border border-border px-4 py-4 focus:outline-none focus:border-gold"/>
          <button className="bg-ink text-bone px-6 text-xs uppercase tracking-[0.3em]">Find</button>
        </form>

        <div className="mt-12 space-y-6">
          {results === null && <p className="text-muted-foreground text-sm">Awaiting input.</p>}
          {results !== null && results.length === 0 && <p className="text-muted-foreground">No bookings found.</p>}
          {results?.map(b => (
            <article key={b.reference} className="border border-border p-6 grid md:grid-cols-[1fr_auto] gap-6">
              <div>
                <div className="flex items-baseline gap-4 flex-wrap">
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
                <pre className="mt-4 text-xs bg-secondary p-3 overflow-auto whitespace-pre-wrap font-sans">
{JSON.stringify(b.details, null, 2)}
                </pre>
              </div>
              <div className="text-right md:border-l md:pl-6 border-border">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</div>
                <div className="font-display text-3xl">{fmt(b.total)}</div>
                <div className="mt-3 text-sm text-muted-foreground">Paid {fmt(b.amountPaid)}</div>
                <div className="text-sm text-gold">Balance {fmt(b.balanceDue)}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

function Pill({ text, variant }: { text: string; variant?: 'gold' }) {
  return <span className={`text-[10px] uppercase tracking-[0.3em] px-2 py-1 ${variant === 'gold' ? 'bg-gold text-ink' : 'bg-ink text-bone'}`}>{text}</span>;
}
function Detail({ k, v }: { k: string; v: string }) {
  return <div><span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block">{k}</span><span>{v}</span></div>;
}
