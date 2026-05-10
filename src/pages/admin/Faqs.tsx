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

  const save = () => {
    if (!editing) return;
    if (!editing.question.trim()) { toast.error('Question required.'); return; }
    const exists = faqs.some(f => f.id === editing.id);
    set('faqs', exists ? faqs.map(f => f.id === editing.id ? editing : f) : [...faqs, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete FAQ?', destructive: true, confirmText: 'Delete' })) {
      set('faqs', faqs.filter(f => f.id !== id));
    }
  };

  const sorted = [...faqs].sort((a, b) => a.order - b.order);

  return (
    <AdminPage title="FAQs"
      action={<PrimaryBtn onClick={() => setEditing(blank(faqs.length + 1))}>+ New FAQ</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {sorted.map(f => (
          <div key={f.id} className="grid grid-cols-[60px_1fr_auto_auto] gap-4 p-4 items-start">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground pt-1">#{f.order}</span>
            <div>
              <div className="font-display text-lg">{f.question}</div>
              <p className="text-sm text-muted-foreground mt-1">{f.answer}</p>
              {!f.published && <span className="chip mt-2">Draft</span>}
            </div>
            <GhostBtn onClick={() => setEditing(f)}>Edit</GhostBtn>
            <GhostBtn onClick={() => remove(f.id)}>Delete</GhostBtn>
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
