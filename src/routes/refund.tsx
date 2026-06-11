import { createFileRoute } from "@tanstack/react-router";
import SiteLayout from "@/components/SiteLayout";
import { useStoreBase } from "@/lib/store";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — AB Consult" },
      { name: "description", content: "Review AB Consult's refund and cancellation policies for venue bookings and equipment rentals." },
      { property: "og:title", content: "Refund Policy — AB Consult" },
      { property: "og:description", content: "Review AB Consult's refund and cancellation policies for venue bookings and equipment rentals." },
      { property: "og:url", content: "https://allbrothersconsult.com/refund" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Refund Policy — AB Consult" },
      { name: "twitter:description", content: "AB Consult's refund and cancellation policies." },
    ],
  }),
  component: () => <StaticPage which="refund" />,
});

function StaticPage({
  which,
}: {
  which: "about" | "privacy" | "terms" | "refund";
}) {
  const page = useStoreBase((s) => s.content[which]);
  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">
            AB Consult
          </div>
          <h1 className="font-display text-5xl md:text-6xl">{page.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Updated {new Date(page.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </section>
      <article className="mx-auto max-w-3xl px-6 lg:px-10 py-16 prose prose-invert">
        {page.body.split(/\n\n+/).map((p, i) => (
          <p
            key={i}
            className="text-foreground/85 leading-relaxed mb-5 whitespace-pre-line"
          >
            {p}
          </p>
        ))}
      </article>
    </SiteLayout>
  );
}
