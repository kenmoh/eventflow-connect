import SiteLayout from '@/components/SiteLayout';
import { useStore } from '@/lib/store';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

export default function Hotels() {
  const { store } = useStore();
  const [q, setQ] = useState('');
  const filtered = store.hotels.filter(h =>
    (h.name + h.location + h.tagline).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <SiteLayout>
      <section className="pt-32 pb-12 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Reservations</div>
          <h1 className="font-display text-6xl md:text-7xl max-w-3xl">A small, considered roster of hotels.</h1>
          <div className="mt-10 max-w-md">
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search hotels, cities, moods…"
              className="w-full bg-transparent border-b border-foreground/30 py-3 text-lg focus:outline-none focus:border-gold placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-20">
          {filtered.map((h, i) => (
            <Link key={h.id} to={`/hotels/${h.id}`} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img src={h.image} alt={h.name} loading="lazy" width={1000} height={750}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
                <div className="absolute top-4 left-4 bg-bone/90 text-ink px-3 py-1 text-[10px] uppercase tracking-[0.3em]">
                  No. {String(i+1).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-5 flex items-baseline justify-between">
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl truncate">{h.name}</h3>
                <span className="text-sm text-muted-foreground">{h.location}</span>
              </div>
              <p className="text-muted-foreground mt-2">{h.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {h.amenities.map(a => (
                  <span key={a} className="text-[10px] uppercase tracking-[0.25em] border border-border px-2 py-1">{a}</span>
                ))}
              </div>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground">No hotels match.</p>}
        </div>
      </section>
    </SiteLayout>
  );
}
