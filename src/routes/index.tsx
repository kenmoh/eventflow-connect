import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowUpRight } from 'lucide-react'
import SiteLayout from '@/components/SiteLayout'
import { useStoreBase, fmt } from '@/lib/store'
import heroBallroom from '@/assets/hero-ballroom.jpg'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { name: "description", content: "AB Consult - Premium event venue booking and equipment rental. Find hotels, event halls, and rent equipment for weddings, conferences, and parties." },
      { property: "og:title", content: "AB Consult — Book Events. Rent Equipment." },
      { property: "og:description", content: "Premium event venue booking and equipment rental services." },
      { property: "og:url", content: "https://abconsult.com/" },
    ],
  }),
  component: Home,
})

function Home() {
  const branding = useStoreBase(s => s.branding);
  const c = useStoreBase(s => s.content);
  const hotels = useStoreBase(s => s.hotels);
  const packages = useStoreBase(s => s.packages);
  const rentals = useStoreBase(s => s.rentals);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative min-h-screen bg-ink text-bone grain overflow-hidden">
        <img src={heroBallroom} alt="Editorial ballroom at golden hour"
          className="absolute inset-0 w-full h-full object-cover opacity-40" width={1920} height={1080}/>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 via-ink/50 to-ink" />
        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10 pt-40 pb-24 min-h-screen flex flex-col justify-between">
          <div className="grid lg:grid-cols-12 gap-10 items-end flex-1">
            <div className="lg:col-span-8 fade-up">
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-6">{c.hero.eyebrow}</div>
              <h1 className="font-display text-[clamp(2.5rem,7.5vw,7rem)] leading-[0.95] text-balance">
                {c.hero.title1}<br/>
                <span className="italic text-gold">{c.hero.title2.split(' ')[0]}</span> {c.hero.title2.split(' ').slice(1).join(' ')}<br/>
                {c.hero.title3}
              </h1>
            </div>
            <div className="lg:col-span-4 lg:pl-10 lg:border-l border-bone/15 fade-up">
              <p className="text-bone/75 text-lg leading-relaxed">{c.hero.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/hotels" className="group inline-flex items-center gap-2 bg-gold text-ink px-6 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold/90 transition">
                  {c.hero.primaryCta}
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <Link to="/rentals" className="group inline-flex items-center gap-2 border border-bone/30 px-6 py-4 text-xs uppercase tracking-[0.25em] hover:bg-bone hover:text-ink transition">
                  {c.hero.secondaryCta}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-bone/10 border border-bone/10">
            {c.stats.map((s) => (
              <div key={s.label} className="bg-ink p-6">
                <div className="font-display text-3xl text-gold">{s.value}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-bone/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="bg-ink text-bone border-y border-bone/10 overflow-hidden">
        <div className="ticker flex whitespace-nowrap py-4 text-xs uppercase tracking-[0.5em] text-bone/50">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-12 pr-12">
              {c.ticker.flatMap((t, j) => [
                <span key={`${i}-${j}`}>{t}</span>,
                <span key={`${i}-${j}-d`}>·</span>,
              ])}
            </div>
          ))}
        </div>
      </div>

      {/* HOTELS */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">{c.reservations.eyebrow}</div>
            <h2 className="font-display text-5xl md:text-6xl max-w-2xl">{c.reservations.title}</h2>
          </div>
          <Link to="/hotels" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] hover:text-gold">
            See all hotels <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          {hotels.slice(0, 3).map((h, i) => (
            <Link key={h.id} to="/hotels/$id" params={{ id: h.id }} className="group block bg-card p-6 hover:bg-secondary transition">
              <div className="aspect-[4/5] overflow-hidden mb-5 bg-muted">
                <img src={h.image} alt={h.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy" width={800} height={1000}/>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">0{i+1}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{h.location}</div>
              </div>
              <h3 className="font-display text-3xl mt-2">{h.name}</h3>
              <p className="text-muted-foreground mt-2">{h.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section className="bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4">
              <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">02 — Catering</div>
              <h2 className="font-display text-5xl md:text-6xl">{c.packagesSection.title}</h2>
              <p className="mt-6 text-muted-foreground max-w-md">{c.packagesSection.copy}</p>
            </div>
            <div className="lg:col-span-8 grid sm:grid-cols-3 gap-px bg-border">
              {packages.slice(0, 3).map((p, i) => (
                <div key={p.id} className="bg-background p-8 flex flex-col">
                  <div className="font-display text-5xl text-gold/70">0{i+1}</div>
                  <h3 className="font-display text-2xl mt-4">{p.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2 mb-6">{p.description}</p>
                  <ul className="space-y-1 text-sm flex-1">
                    {p.items.map(it => <li key={it} className="text-foreground/80">— {it}</li>)}
                  </ul>
                  <div className="mt-6 pt-4 border-t border-border flex items-baseline justify-between">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">per person</span>
                    <span className="font-display text-2xl">{fmt(p.pricePerPerson)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RENTALS */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
        <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">{c.rentalsSection.eyebrow}</div>
            <h2 className="font-display text-5xl md:text-6xl max-w-2xl">{c.rentalsSection.title}</h2>
          </div>
          <Link to="/rentals" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] hover:text-gold">
            Open the catalogue <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rentals.slice(0, 3).map((r) => (
            <Link key={r.id} to="/rentals" className="group block">
              <div className="aspect-[5/4] overflow-hidden bg-muted mb-4">
                <img src={r.image} alt={r.name} loading="lazy" width={800} height={640}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{r.category}</div>
                  <div className="font-display text-xl mt-1">{r.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg">{fmt(r.pricePerDay)}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">/day</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary border-t border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 lg:py-32">
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-3">{c.howItWorks.eyebrow}</div>
          <h2 className="font-display text-5xl md:text-6xl max-w-3xl">{c.howItWorks.title}</h2>
          <div className="mt-16 grid md:grid-cols-3 gap-px bg-border">
            {c.howItWorks.steps.map((s, i) => (
              <div key={s.title} className="bg-secondary p-10">
                <div className="font-display text-7xl text-gold/80">0{i+1}</div>
                <div className="font-display text-3xl mt-4">{s.title}.</div>
                <p className="mt-3 text-muted-foreground max-w-xs">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
