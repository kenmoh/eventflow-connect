import { createFileRoute } from "@tanstack/react-router";
import SiteLayout from "@/components/SiteLayout";
import { useStoreBase } from "@/lib/store";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — AB Consult" },
      { name: "description", content: "Learn about AB Consult's mission to provide exceptional event venue booking and equipment rental services." },
      { property: "og:title", content: "About Us — AB Consult" },
      { property: "og:url", content: "https://abconsult.com/about" },
    ],
  }),
  component: () => <StaticPage which="about" />,
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
