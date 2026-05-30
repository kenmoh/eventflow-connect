import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn } from './_shared';
import { useState } from 'react';
import { toast } from 'sonner';
import type { SiteContent } from '@/lib/types';

export default function AdminContent() {
  const content = useStoreBase(s => s.content);
  const set = useStoreBase(s => s.set);
  const [c, setC] = useState<SiteContent>(content);

  const save = async () => {
    set('content', c);
    const { saveContent } = await import('@/lib/db');
    try { await saveContent(c); toast.success('Site content updated.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const upd = <K extends keyof SiteContent>(k: K, v: SiteContent[K]) => setC(p => ({ ...p, [k]: v }));

  return (
    <AdminPage title="Site content" subtitle="Edit every word on the public website."
      action={<PrimaryBtn onClick={save}>Save changes</PrimaryBtn>}>
      <div className="space-y-10 max-w-4xl">
        <Block title="Hero">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={c.hero.eyebrow} onChange={e => upd('hero', { ...c.hero, eyebrow: e.target.value })}/></Field>
            <Field label="Primary CTA"><input className={inputCls} value={c.hero.primaryCta} onChange={e => upd('hero', { ...c.hero, primaryCta: e.target.value })}/></Field>
            <Field label="Title line 1"><input className={inputCls} value={c.hero.title1} onChange={e => upd('hero', { ...c.hero, title1: e.target.value })}/></Field>
            <Field label="Title line 2"><input className={inputCls} value={c.hero.title2} onChange={e => upd('hero', { ...c.hero, title2: e.target.value })}/></Field>
            <Field label="Title line 3"><input className={inputCls} value={c.hero.title3} onChange={e => upd('hero', { ...c.hero, title3: e.target.value })}/></Field>
            <Field label="Secondary CTA"><input className={inputCls} value={c.hero.secondaryCta} onChange={e => upd('hero', { ...c.hero, secondaryCta: e.target.value })}/></Field>
            <div className="md:col-span-2"><Field label="Description"><textarea rows={3} className={inputCls} value={c.hero.description} onChange={e => upd('hero', { ...c.hero, description: e.target.value })}/></Field></div>
          </div>
        </Block>

        <Block title="Stats strip">
          {c.stats.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2 mb-2 items-end">
              <input className={inputCls} value={s.value} onChange={e => upd('stats', c.stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="03"/>
              <input className={inputCls} value={s.label} onChange={e => upd('stats', c.stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Cities"/>
              <button onClick={() => upd('stats', c.stats.filter((_, j) => j !== i))} className="text-xs text-muted-foreground hover:text-destructive uppercase tracking-[0.25em]">Remove</button>
            </div>
          ))}
          <button onClick={() => upd('stats', [...c.stats, { value: '00', label: 'New' }])} className="text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-secondary">+ Add stat</button>
        </Block>

        <Block title="Ticker phrases">
          <Field label="One per line">
            <textarea rows={5} className={inputCls} value={c.ticker.join('\n')} onChange={e => upd('ticker', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}/>
          </Field>
        </Block>

        <Block title="Reservations section">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={c.reservations.eyebrow} onChange={e => upd('reservations', { ...c.reservations, eyebrow: e.target.value })}/></Field>
            <Field label="Title"><input className={inputCls} value={c.reservations.title} onChange={e => upd('reservations', { ...c.reservations, title: e.target.value })}/></Field>
          </div>
        </Block>

        <Block title="Packages section">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={c.packagesSection.eyebrow} onChange={e => upd('packagesSection', { ...c.packagesSection, eyebrow: e.target.value })}/></Field>
            <Field label="Title"><input className={inputCls} value={c.packagesSection.title} onChange={e => upd('packagesSection', { ...c.packagesSection, title: e.target.value })}/></Field>
            <div className="md:col-span-2"><Field label="Copy"><textarea rows={2} className={inputCls} value={c.packagesSection.copy} onChange={e => upd('packagesSection', { ...c.packagesSection, copy: e.target.value })}/></Field></div>
          </div>
        </Block>

        <Block title="Rentals section">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Eyebrow"><input className={inputCls} value={c.rentalsSection.eyebrow} onChange={e => upd('rentalsSection', { ...c.rentalsSection, eyebrow: e.target.value })}/></Field>
            <Field label="Title"><input className={inputCls} value={c.rentalsSection.title} onChange={e => upd('rentalsSection', { ...c.rentalsSection, title: e.target.value })}/></Field>
          </div>
        </Block>

        <Block title="How it works">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Field label="Eyebrow"><input className={inputCls} value={c.howItWorks.eyebrow} onChange={e => upd('howItWorks', { ...c.howItWorks, eyebrow: e.target.value })}/></Field>
            <Field label="Title"><input className={inputCls} value={c.howItWorks.title} onChange={e => upd('howItWorks', { ...c.howItWorks, title: e.target.value })}/></Field>
          </div>
          {c.howItWorks.steps.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_3fr_auto] gap-2 mb-2 items-end">
              <input className={inputCls} value={s.title} onChange={e => upd('howItWorks', { ...c.howItWorks, steps: c.howItWorks.steps.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Choose"/>
              <input className={inputCls} value={s.copy} onChange={e => upd('howItWorks', { ...c.howItWorks, steps: c.howItWorks.steps.map((x, j) => j === i ? { ...x, copy: e.target.value } : x) })} placeholder="Step description"/>
              <button onClick={() => upd('howItWorks', { ...c.howItWorks, steps: c.howItWorks.steps.filter((_, j) => j !== i) })} className="text-xs text-muted-foreground hover:text-destructive uppercase tracking-[0.25em]">Remove</button>
            </div>
          ))}
          <button onClick={() => upd('howItWorks', { ...c.howItWorks, steps: [...c.howItWorks.steps, { title: 'New', copy: '' }] })} className="text-xs uppercase tracking-[0.25em] border border-border px-3 py-2 hover:bg-secondary">+ Add step</button>
        </Block>

        <Block title="Footer">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Field label="Blurb"><textarea rows={2} className={inputCls} value={c.footer.blurb} onChange={e => upd('footer', { ...c.footer, blurb: e.target.value })}/></Field></div>
            <Field label="Email"><input className={inputCls} value={c.footer.contactEmail} onChange={e => upd('footer', { ...c.footer, contactEmail: e.target.value })}/></Field>
            <Field label="Phone"><input className={inputCls} value={c.footer.contactPhone} onChange={e => upd('footer', { ...c.footer, contactPhone: e.target.value })}/></Field>
            <Field label="Cities"><input className={inputCls} value={c.footer.contactCity} onChange={e => upd('footer', { ...c.footer, contactCity: e.target.value })}/></Field>
            <Field label="Rights line"><input className={inputCls} value={c.footer.rightsLine} onChange={e => upd('footer', { ...c.footer, rightsLine: e.target.value })}/></Field>
          </div>
        </Block>
      </div>
      <div className="mt-8"><PrimaryBtn onClick={save}>Save changes</PrimaryBtn></div>
    </AdminPage>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-card p-6">
      <h2 className="font-display text-2xl mb-4">{title}</h2>
      {children}
    </section>
  );
}
