import { useStore } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Pkg } from '@/lib/types';
import { toast } from 'sonner';

const blank = (): Pkg => ({ id: crypto.randomUUID(), name: '', emoji: '✨', description: '', items: [], pricePerPerson: 25 });

export default function AdminPackages() {
  const { store, set } = useStore();
  const [editing, setEditing] = useState<Pkg | null>(null);

  const save = () => {
    if (!editing) return;
    const exists = store.packages.some(p => p.id === editing.id);
    set('packages', exists ? store.packages.map(p => p.id === editing.id ? editing : p) : [...store.packages, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = (id: string) => { if (confirm('Delete?')) set('packages', store.packages.filter(p => p.id !== id)); };

  return (
    <AdminPage title="Packages" subtitle="Replace menus with curated F&B bundles."
      action={<PrimaryBtn onClick={() => setEditing(blank())}>+ New package</PrimaryBtn>}>
      <div className="grid md:grid-cols-3 gap-4">
        {store.packages.map(p => (
          <div key={p.id} className="border border-border p-5">
            <div className="text-3xl">{p.emoji}</div>
            <div className="font-display text-2xl mt-2">{p.name}</div>
            <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
            <div className="mt-3 font-display">${p.pricePerPerson} <span className="text-xs text-muted-foreground">/pp</span></div>
            <ul className="mt-3 text-xs text-muted-foreground space-y-1">{p.items.map(i => <li key={i}>— {i}</li>)}</ul>
            <div className="mt-4 flex gap-2">
              <GhostBtn onClick={() => setEditing(p)}>Edit</GhostBtn>
              <GhostBtn onClick={() => remove(p.id)}>Delete</GhostBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-background w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Package</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
              <Field label="Emoji"><input className={inputCls} value={editing.emoji} onChange={e => setEditing({ ...editing, emoji: e.target.value })}/></Field>
              <Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field>
              <Field label="Price / person"><input type="number" className={inputCls} value={editing.pricePerPerson} onChange={e => setEditing({ ...editing, pricePerPerson: +e.target.value })}/></Field>
              <div className="md:col-span-2">
                <Field label="Items (one per line)">
                  <textarea rows={5} className={inputCls} value={editing.items.join('\n')} onChange={e => setEditing({ ...editing, items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}/>
                </Field>
              </div>
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
