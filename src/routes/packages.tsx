import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import SiteLayout from '@/components/SiteLayout'
import { useStoreBase, fmt } from '@/lib/store'

export const Route = createFileRoute('/packages')({
  component: Packages,
})

function Packages() {
  const packages = useStoreBase(s => s.packages);
  const hotels = useStoreBase(s => s.hotels);
  const [kind, setKind] = useState<'all' | 'coffee' | 'food'>('all');

  const filtered = packages.filter(p => kind === 'all' || p.kind === kind);

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Packages</div>
          <h1 className="font-display text-6xl md:text-7xl max-w-3xl">Coffee breaks and full menus.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">Curated F&B packages, scoped to each hotel. Pick what you need at booking.</p>
          <div className="mt-8 flex gap-1 bg-secondary p-1 w-fit border border-border">
            {(['all','coffee','food'] as const).map(k => (
              <button key={k} onClick={() => setKind(k)}
                className={`px-4 py-2 text-xs uppercase tracking-[0.25em] ${kind === k ? 'bg-ink text-ink-foreground' : 'hover:bg-background'}`}>
                {k}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
        {filtered.map(p => {
          const hotel = hotels.find(h => h.id === p.hotelId);
          return (
            <article key={p.id} className="bg-background p-6 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="chip">{p.kind === 'coffee' ? 'Coffee' : 'Food'}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-gold">{hotel?.name}</span>
              </div>
              <h3 className="font-display text-2xl mt-3">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1">{p.description}</p>
              <ul className="mt-3 text-xs text-foreground/80 space-y-1">{p.items.map(i => <li key={i}>— {i}</li>)}</ul>
              <div className="mt-3 flex flex-wrap gap-1">
                {p.timeSlots.map(t => <span key={t.id} className="chip">{t.label} · {t.time}</span>)}
              </div>
              <div className="mt-5 pt-4 border-t border-border flex items-baseline justify-between">
                <span className="font-display text-2xl">{fmt(p.pricePerPerson)}</span>
                <Link to="/hotels/$id" params={{ id: p.hotelId }} className="text-xs uppercase tracking-[0.25em] hover:text-gold">Book at {hotel?.name} →</Link>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && <p className="bg-background p-10 text-muted-foreground">No packages yet.</p>}
      </section>
    </SiteLayout>
  );
}
