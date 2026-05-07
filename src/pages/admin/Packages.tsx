import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Pkg } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmProvider';

const blank = (): Pkg => ({ id: crypto.randomUUID(), name: '', description: '', items: [], pricePerPerson: 15000 });

export default function AdminPackages() {
  const packages = useStoreBase(s => s.packages);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const { confirm } = useConfirm();

  const save = () => {
    if (!editing) return;
    const exists = packages.some(p => p.id === editing.id);
    set('packages', exists ? packages.map(p => p.id === editing.id ? editing : p) : [...packages, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete package?', destructive: true, confirmText: 'Delete' })) {
      set('packages', packages.filter(p => p.id !== id));
    }
  };

  return (
    <AdminPage title="Packages" subtitle="Replace menus with curated F&B bundles."
      action={<PrimaryBtn onClick={() => setEditing(blank())}>+ New package</PrimaryBtn>}>
      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((p, i) => (
          <div key={p.id} className="border border-border p-5 bg-card">
            <div className="font-display text-4xl text-gold/70">0{i+1}</div>
            <div className="font-display text-2xl mt-2">{p.name}</div>
            <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
            <div className="mt-3 font-display">{fmt(p.pricePerPerson)} <span className="text-xs text-muted-foreground">/pp</span></div>
            <ul className="mt-3 text-xs text-muted-foreground space-y-1">{p.items.map(it => <li key={it}>— {it}</li>)}</ul>
            <div className="mt-4 flex gap-2">
              <GhostBtn onClick={() => setEditing(p)}>Edit</GhostBtn>
              <GhostBtn onClick={() => remove(p.id)}>Delete</GhostBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-card w-full max-w-2xl p-8 border border-border" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Package</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
              <Field label="Price / person (NGN)"><input type="number" className={inputCls} value={editing.pricePerPerson} onChange={e => setEditing({ ...editing, pricePerPerson: +e.target.value })}/></Field>
              <div className="md:col-span-2"><Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field></div>
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
