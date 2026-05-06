import { useStore } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Room } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';

const blank = (hotelId: string): Room => ({ id: crypto.randomUUID(), hotelId, type: '', description: '', price: 200, capacity: 2, image: heroBallroom });

export default function AdminRooms() {
  const { store, set } = useStore();
  const [editing, setEditing] = useState<Room | null>(null);

  const save = () => {
    if (!editing) return;
    const exists = store.rooms.some(r => r.id === editing.id);
    set('rooms', exists ? store.rooms.map(r => r.id === editing.id ? editing : r) : [...store.rooms, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = (id: string) => {
    if (!confirm('Delete room?')) return;
    set('rooms', store.rooms.filter(r => r.id !== id));
  };

  return (
    <AdminPage title="Rooms"
      action={<PrimaryBtn onClick={() => setEditing(blank(store.hotels[0]?.id || ''))}>+ New room</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border">
        {store.rooms.map(r => {
          const hotel = store.hotels.find(h => h.id === r.hotelId);
          return (
            <div key={r.id} className="grid grid-cols-[1fr_auto_auto] gap-4 p-4 items-center">
              <div>
                <div className="font-display text-xl">{r.type}</div>
                <div className="text-xs text-muted-foreground">{hotel?.name || '—'} · sleeps {r.capacity}</div>
              </div>
              <div className="font-display">${r.price}/n</div>
              <div className="flex gap-2">
                <GhostBtn onClick={() => setEditing(r)}>Edit</GhostBtn>
                <GhostBtn onClick={() => remove(r.id)}>Delete</GhostBtn>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-background w-full max-w-2xl p-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Room</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Hotel">
                <select className={inputCls} value={editing.hotelId} onChange={e => setEditing({ ...editing, hotelId: e.target.value })}>
                  {store.hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </Field>
              <Field label="Type"><input className={inputCls} value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}/></Field>
              <Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field>
              <Field label="Price / night"><input type="number" className={inputCls} value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })}/></Field>
              <Field label="Capacity"><input type="number" className={inputCls} value={editing.capacity} onChange={e => setEditing({ ...editing, capacity: +e.target.value })}/></Field>
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
