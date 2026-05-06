import { useStore } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Hall } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';

const blank = (hotelId: string): Hall => ({ id: crypto.randomUUID(), hotelId, name: '', capacity: 50, pricePerHour: 100, image: heroBallroom });

export default function AdminHalls() {
  const { store, set } = useStore();
  const [editing, setEditing] = useState<Hall | null>(null);

  const save = () => {
    if (!editing) return;
    const exists = store.halls.some(h => h.id === editing.id);
    set('halls', exists ? store.halls.map(h => h.id === editing.id ? editing : h) : [...store.halls, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = (id: string) => { if (confirm('Delete?')) set('halls', store.halls.filter(h => h.id !== id)); };

  return (
    <AdminPage title="Event halls"
      action={<PrimaryBtn onClick={() => setEditing(blank(store.hotels[0]?.id || ''))}>+ New hall</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border">
        {store.halls.map(h => {
          const hotel = store.hotels.find(x => x.id === h.hotelId);
          return (
            <div key={h.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
              <div>
                <div className="font-display text-xl">{h.name}</div>
                <div className="text-xs text-muted-foreground">{hotel?.name} · capacity {h.capacity}</div>
              </div>
              <div className="font-display">${h.pricePerHour}/hr</div>
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(h)}>Edit</GhostBtn>
                <GhostBtn onClick={() => remove(h.id)}>Delete</GhostBtn>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-background w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Hall</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Hotel">
                <select className={inputCls} value={editing.hotelId} onChange={e => setEditing({ ...editing, hotelId: e.target.value })}>
                  {store.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </Field>
              <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
              <Field label="Capacity"><input type="number" className={inputCls} value={editing.capacity} onChange={e => setEditing({ ...editing, capacity: +e.target.value })}/></Field>
              <Field label="Price / hour"><input type="number" className={inputCls} value={editing.pricePerHour} onChange={e => setEditing({ ...editing, pricePerHour: +e.target.value })}/></Field>
              <Field label="Image URL"><input className={inputCls} value={editing.image} onChange={e => setEditing({ ...editing, image: e.target.value })}/></Field>
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
