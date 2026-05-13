import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { FAQ } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmProvider';
import { upsertFaq, deleteFaq } from '@/lib/db';

const blank = (order: number): FAQ => ({ id: crypto.randomUUID(), question: '', answer: '', order, published: true });

export default function AdminFaqs() {
  const faqs = useStoreBase(s => s.faqs);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const { confirm } = useConfirm();

  const save = async () => {
    if (!editing) return;
    if (!editing.question.trim()) { toast.error('Question required.'); return; }
    const exists = faqs.some(f => f.id === editing.id);
    set('faqs', exists ? faqs.map(f => f.id === editing.id ? editing : f) : [...faqs, editing]);
    setEditing(null);
    try { await upsertFaq(editing); toast.success('Saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete FAQ?', destructive: true, confirmText: 'Delete' })) {
      set('faqs', faqs.filter(f => f.id !== id));
      try { await deleteFaq(id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  const sorted = [...faqs].sort((a, b) => a.order - b.order);

  return (
    <AdminPage title="FAQs"
      action={<PrimaryBtn onClick={() => setEditing(blank(faqs.length + 1))}>+ New FAQ</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {sorted.map(f => (
          <div key={f.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 items-start min-w-0">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground shrink-0">#{f.order}</span>
            <div className="flex-1 min-w-0 w-full">
              <div className="font-display text-base sm:text-lg truncate">{f.question}</div>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.answer}</p>
              {!f.published && <span className="chip mt-2">Draft</span>}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <GhostBtn onClick={() => setEditing(f)} className="flex-1 sm:flex-none text-xs py-2">Edit</GhostBtn>
              <GhostBtn onClick={() => remove(f.id)} className="flex-1 sm:flex-none text-xs py-2">Delete</GhostBtn>
            </div>
          </div>
        ))}
        {faqs.length === 0 && <p className="p-6 text-muted-foreground">No FAQs yet.</p>}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-card w-full max-w-2xl p-8 border border-border max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">FAQ</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Order"><input type="number" className={inputCls} value={editing.order} onChange={e => setEditing({ ...editing, order: +e.target.value })}/></Field>
              <Field label="Status">
                <select className={inputCls} value={editing.published ? 'pub' : 'draft'} onChange={e => setEditing({ ...editing, published: e.target.value === 'pub' })}>
                  <option value="pub">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
              <div className="md:col-span-2"><Field label="Question"><input className={inputCls} value={editing.question} onChange={e => setEditing({ ...editing, question: e.target.value })}/></Field></div>
              <div className="md:col-span-2"><Field label="Answer"><textarea rows={5} className={inputCls} value={editing.answer} onChange={e => setEditing({ ...editing, answer: e.target.value })}/></Field></div>
            </div>
            <div className="mt-6 flex gap-2 justify-end">
              <GhostBtn onClick={() => setEditing(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={save}>Save</PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
