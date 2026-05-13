import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import type { Hall } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import { useConfirm } from '@/components/ConfirmProvider';
import { X } from 'lucide-react';
import { upsertHall, deleteHall } from '@/lib/db';

const SUGGESTED = ['PA System', 'Mints', 'Notepad', 'Pen', 'Flip Chart', 'Projector', 'Wireless Mics', 'Stage', 'Whiteboard', 'Coffee station'];

const blank = (hotelId: string): Hall => ({
  id: crypto.randomUUID(), hotelId, name: '', capacity: 50, pricePerHour: 80000,
  image: heroBallroom, amenities: [],
});

export default function AdminHalls() {
  const halls = useStoreBase(s => s.halls);
  const hotels = useStoreBase(s => s.hotels);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<Hall | null>(null);
  const [amenityInput, setAmenityInput] = useState('');
  const { confirm } = useConfirm();

  const save = async () => {
    if (!editing) return;
    const exists = halls.some(h => h.id === editing.id);
    set('halls', exists ? halls.map(h => h.id === editing.id ? editing : h) : [...halls, editing]);
    setEditing(null);
    try { await upsertHall(editing); toast.success('Saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete hall?', destructive: true, confirmText: 'Delete' })) {
      set('halls', halls.filter(h => h.id !== id));
      try { await deleteHall(id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  const addAmenity = (val: string) => {
    if (!editing || !val.trim()) return;
    const a = val.trim();
    if (editing.amenities.includes(a)) return;
    setEditing({ ...editing, amenities: [...editing.amenities, a] });
    setAmenityInput('');
  };
  const removeAmenity = (a: string) => {
    if (!editing) return;
    setEditing({ ...editing, amenities: editing.amenities.filter(x => x !== a) });
  };

  return (
    <AdminPage title="Event halls"
      action={<PrimaryBtn onClick={() => setEditing(blank(hotels[0]?.id || ''))}>+ New hall</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {halls.map(h => {
          const hotel = hotels.find(x => x.id === h.hotelId);
          return (
            <div key={h.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 items-start sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="font-display text-base sm:text-xl truncate">{h.name}</div>
                <div className="text-xs text-muted-foreground truncate">{hotel?.name} · capacity {h.capacity}</div>
                {h.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.amenities.map(a => <span key={a} className="chip">{a}</span>)}
                  </div>
                )}
              </div>
              <div className="font-display text-sm sm:text-base">{fmt(h.pricePerHour)}/hr</div>
              <div className="flex gap-2 w-full sm:w-auto">
                <GhostBtn onClick={() => setEditing(h)} className="flex-1 sm:flex-none text-xs py-2">Edit</GhostBtn>
                <GhostBtn onClick={() => remove(h.id)} className="flex-1 sm:flex-none text-xs py-2">Delete</GhostBtn>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Hall">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Hotel">
              <select className={inputCls} value={editing.hotelId} onChange={e => setEditing({ ...editing, hotelId: e.target.value })}>
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </Field>
            <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
            <Field label="Capacity"><input type="number" className={inputCls} value={editing.capacity} onChange={e => setEditing({ ...editing, capacity: +e.target.value })}/></Field>
            <Field label="Price / hour (NGN)"><input type="number" className={inputCls} value={editing.pricePerHour} onChange={e => setEditing({ ...editing, pricePerHour: +e.target.value })}/></Field>
            <div className="md:col-span-2">
              <Field label="Amenities">
                <div className="flex gap-2">
                  <input className={inputCls} value={amenityInput}
                    onChange={e => setAmenityInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(amenityInput); } }}
                    placeholder="Type an amenity and press Enter…"/>
                  <GhostBtn type="button" onClick={() => addAmenity(amenityInput)}>Add</GhostBtn>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {SUGGESTED.filter(s => !editing.amenities.includes(s)).map(s => (
                    <button key={s} type="button" onClick={() => addAmenity(s)} className="chip hover:bg-secondary">+ {s}</button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {editing.amenities.map(a => (
                    <span key={a} className="chip-gold chip inline-flex items-center gap-1">
                      {a}
                      <button type="button" onClick={() => removeAmenity(a)}><X className="w-3 h-3"/></button>
                    </span>
                  ))}
                  {editing.amenities.length === 0 && <span className="text-xs text-muted-foreground">None added.</span>}
                </div>
              </Field>
            </div>
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
