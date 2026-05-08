import SiteLayout from '@/components/SiteLayout';
import { useStoreBase } from '@/lib/store';

type Key = 'about' | 'privacy' | 'terms' | 'refund';

export default function StaticPage({ which }: { which: Key }) {
  const page = useStoreBase(s => s.content[which]);
  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">All Brothers Consult</div>
          <h1 className="font-display text-5xl md:text-6xl">{page.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">Updated {new Date(page.updatedAt).toLocaleDateString()}</p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-6 lg:px-10 py-16 prose prose-invert">
        {page.body.split(/\n\n+/).map((p, i) => (
          <p key={i} className="text-foreground/85 leading-relaxed mb-5 whitespace-pre-line">{p}</p>
        ))}
      </article>
    </SiteLayout>
  );
}
