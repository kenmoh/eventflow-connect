import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn } from './_shared';
import { useState } from 'react';
import { toast } from 'sonner';
import type { SiteContent, LegalPage } from '@/lib/types';

type Key = 'about' | 'privacy' | 'terms' | 'refund';

export default function AdminLegal() {
  const content = useStoreBase(s => s.content);
  const set = useStoreBase(s => s.set);
  const [tab, setTab] = useState<Key>('about');
  const [draft, setDraft] = useState<SiteContent>(content);

  const update = (key: Key, patch: Partial<LegalPage>) => {
    setDraft({ ...draft, [key]: { ...draft[key], ...patch, updatedAt: new Date().toISOString() } });
  };
  const save = async () => {
    set('content', draft);
    const { saveContent } = await import('@/lib/db');
    try { await saveContent(draft); toast.success('Pages updated.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };

  return (
    <AdminPage title="Legal & About" subtitle="About, Privacy, Terms and Refund pages."
      action={<PrimaryBtn onClick={save}>Save changes</PrimaryBtn>}>
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['about','privacy','terms','refund'] as Key[]).map(k => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.25em] ${tab === k ? 'border-b-2 border-gold text-gold' : 'text-muted-foreground hover:text-foreground'}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="space-y-4 max-w-3xl">
        <Field label="Title"><input className={inputCls} value={draft[tab].title} onChange={e => update(tab, { title: e.target.value })}/></Field>
        <Field label="Body (markdown-ish, blank line = paragraph)">
          <textarea rows={20} className={inputCls} value={draft[tab].body} onChange={e => update(tab, { body: e.target.value })}/>
        </Field>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Last updated: {new Date(draft[tab].updatedAt).toLocaleString()}</p>
      </div>
    </AdminPage>
  );
}
