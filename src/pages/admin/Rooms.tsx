import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import type { Room } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import { useConfirm } from '@/components/ConfirmProvider';

const blank = (hotelId: string): Room => ({ id: crypto.randomUUID(), hotelId, type: '', description: '', price: 150000, capacity: 2, image: heroBallroom });

export default function AdminRooms() {
  const rooms = useStoreBase(s => s.rooms);
  const hotels = useStoreBase(s => s.hotels);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<Room | null>(null);
  const { confirm } = useConfirm();

  const save = async () => {
    if (!editing) return;
    const exists = rooms.some(r => r.id === editing.id);
    set('rooms', exists ? rooms.map(r => r.id === editing.id ? editing : r) : [...rooms, editing]);
    setEditing(null);
    const { upsertRoom } = await import('@/lib/db');
    try { await upsertRoom(editing); toast.success('Saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete room?', destructive: true, confirmText: 'Delete' })) {
      set('rooms', rooms.filter(r => r.id !== id));
      const { deleteRoom } = await import('@/lib/db');
      try { await deleteRoom(id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  return (
    <AdminPage title="Rooms"
      action={<PrimaryBtn onClick={() => setEditing(blank(hotels[0]?.id || ''))}>+ New room</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {rooms.map(r => {
          const hotel = hotels.find(h => h.id === r.hotelId);
          return (
            <div key={r.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 items-start sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="font-display text-base sm:text-xl truncate">{r.type}</div>
                <div className="text-xs text-muted-foreground truncate">{hotel?.name || '—'} · sleeps {r.capacity}</div>
              </div>
              <div className="font-display text-sm sm:text-base">{fmt(r.price)}/n</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <GhostBtn onClick={() => setEditing(r)} className="flex-1 sm:flex-none text-xs py-2">Edit</GhostBtn>
                <GhostBtn onClick={() => remove(r.id)} className="flex-1 sm:flex-none text-xs py-2">Delete</GhostBtn>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Room">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Hotel">
              <select className={inputCls} value={editing.hotelId} onChange={e => setEditing({ ...editing, hotelId: e.target.value })}>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>
            <Field label="Type"><input className={inputCls} value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value })}/></Field>
            <Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field>
            <Field label="Price / night (NGN)"><input type="number" className={inputCls} value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })}/></Field>
            <Field label="Capacity"><input type="number" className={inputCls} value={editing.capacity} onChange={e => setEditing({ ...editing, capacity: +e.target.value })}/></Field>
            <div className="md:col-span-2"><ImagePicker value={editing.image} onChange={v => setEditing({ ...editing, image: v })}/></div>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <GhostBtn onClick={() => setEditing(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}
    </AdminPage>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-3xl mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
