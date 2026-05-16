import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import SiteLayout from '@/components/SiteLayout'
import { useStoreBase } from '@/lib/store'

export const Route = createFileRoute('/faqs')({
  head: () => ({
    meta: [
      { title: "FAQ — AB Consult" },
      { name: "description", content: "Answers to frequently asked questions about AB Consult's venue booking and equipment rental services." },
      { property: "og:title", content: "FAQ — AB Consult" },
      { property: "og:description", content: "Frequently asked questions about our event venues and equipment rentals." },
      { property: "og:url", content: "https://abconsult.com/faqs" },
    ],
  }),
  component: Faqs,
})

function Faqs() {
  const faqs = useStoreBase(s => s.faqs).filter(f => f.published).sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Help</div>
          <h1 className="font-display text-5xl md:text-6xl">Frequently asked.</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 lg:px-10 py-16 space-y-2">
        {faqs.map(f => (
          <div key={f.id} className="border border-border bg-card">
            <button onClick={() => setOpen(open === f.id ? null : f.id)}
              className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-display text-xl">{f.question}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${open === f.id ? 'rotate-180' : ''}`}/>
            </button>
            {open === f.id && (
              <div className="px-5 pb-5 text-foreground/80 whitespace-pre-line">{f.answer}</div>
            )}
          </div>
        ))}
        {faqs.length === 0 && <p className="text-muted-foreground">No FAQs yet.</p>}
      </section>
    </SiteLayout>
  );
}
