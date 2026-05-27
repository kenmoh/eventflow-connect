import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import SiteLayout from '@/components/SiteLayout'
import { useStore, fmt } from '@/lib/store'
import type { RentalCategory } from '@/lib/types'

const CATS: ('All' | RentalCategory)[] = ['All', 'Sound', 'Lighting', 'Seating', 'Tents', 'Decor'];

export const Route = createFileRoute('/rentals')({
  head: () => ({
    meta: [
      { title: "Equipment Rentals — AB Consult" },
      { name: "description", content: "Rent premium equipment for your events: sound systems, lighting, seating, tents, and decor. Flexible pricing with vendor and internal fulfillment." },
      { property: "og:title", content: "Equipment Rentals — AB Consult" },
      { property: "og:description", content: "Premium event equipment rentals. Sound, lighting, seating, tents, and more." },
      { property: "og:url", content: "https://abconsult.com/rentals" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Equipment Rentals — AB Consult" },
      { name: "twitter:description", content: "Premium event equipment rentals. Sound, lighting, seating, tents, and more." },
    ],
    links: [
      { rel: "canonical", href: "https://abconsult.com/rentals" },
    ],
  }),
  component: Rentals,
})

function Rentals() {
  const { store, addCart } = useStore();
  const [cat, setCat] = useState<'All' | RentalCategory>('All');
  const [q, setQ] = useState('');

  const items = store.rentals.filter(r =>
    (cat === 'All' || r.category === cat) && r.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Rentals</div>
          <h1 className="font-display text-6xl md:text-7xl max-w-3xl">A catalogue, curated.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Internal items pay 100% upfront. Vendor items split — 60–70% to hold,
            balance on confirmation. We handle both at checkout.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-12">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-10">
          <div className="flex flex-wrap gap-1 bg-secondary p-1">
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)}
                className={`px-4 py-2 text-xs uppercase tracking-[0.25em] transition ${cat === c ? 'bg-ink text-bone' : 'hover:bg-background'}`}>
                {c}
              </button>
            ))}
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…"
            className="bg-transparent border-b border-foreground/30 py-2 px-1 focus:outline-none focus:border-gold w-full sm:w-64"/>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {items.map(r => (
            <article key={r.id} className="bg-background p-5 flex flex-col">
              <div className="aspect-[5/4] overflow-hidden bg-muted relative">
                <img src={r.image} alt={r.name} loading="lazy" width={800} height={640} className="w-full h-full object-cover"/>
                <span className={`absolute top-3 left-3 text-[10px] uppercase tracking-[0.3em] px-2 py-1 ${r.ownership === 'internal' ? 'bg-ink text-bone' : 'bg-gold text-ink'}`}>
                  {r.ownership === 'internal' ? 'Fulfilled by us' : `Vendor · ${r.depositPct}% deposit`}
                </span>
              </div>
              <div className="mt-4 flex-1">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{r.category}</div>
                <h3 className="font-display text-2xl mt-1">{r.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl">{fmt(r.pricePerDay)}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">/day</div>
                </div>
                <button onClick={() => { addCart({ itemId: r.id, quantity: 1, days: 1 }); toast.success('Added to cart'); }}
                  className="px-4 py-3 bg-ink text-bone text-xs uppercase tracking-[0.25em] hover:bg-ink/90 transition">
                  Add
                </button>
              </div>
            </article>
          ))}
        </div>
        {items.length === 0 && <p className="text-muted-foreground mt-10">Nothing matches that filter.</p>}
      </section>
    </SiteLayout>
  );
}
