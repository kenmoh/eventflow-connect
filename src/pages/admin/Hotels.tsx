import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import type { Hotel } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import { useConfirm } from '@/components/ConfirmProvider';

const blank = (): Hotel => ({ id: crypto.randomUUID(), name: '', location: '', tagline: '', image: heroBallroom, rating: 4.5, amenities: [] });

export default function AdminHotels() {
  const hotels = useStoreBase(s => s.hotels);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const { confirm } = useConfirm();

  const save = async () => {
    if (!editing) return;
    const exists = hotels.some(h => h.id === editing.id);
    set('hotels', exists ? hotels.map(h => h.id === editing.id ? editing : h) : [...hotels, editing]);
    setEditing(null);
    const { upsertHotel } = await import('@/lib/db');
    try { await upsertHotel(editing); toast.success('Saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete hotel?', destructive: true, confirmText: 'Delete' })) {
      set('hotels', hotels.filter(h => h.id !== id));
      const { deleteHotel } = await import('@/lib/db');
      try { await deleteHotel(id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  return (
    <AdminPage title="Hotels" subtitle="Curated partner hotels."
      action={<PrimaryBtn onClick={() => setEditing(blank())}>+ New hotel</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {hotels.map(h => (
          <div key={h.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 items-start sm:items-center">
            <img src={h.image} alt={h.name} className="w-full sm:w-20 h-32 sm:h-16 object-cover rounded-md" loading="lazy"/>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base sm:text-xl truncate">{h.name || '—'}</div>
              <div className="text-xs text-muted-foreground truncate">{h.location}</div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <GhostBtn onClick={() => setEditing(h)} className="flex-1 sm:flex-none text-xs py-2">Edit</GhostBtn>
              <GhostBtn onClick={() => remove(h.id)} className="flex-1 sm:flex-none text-xs py-2">Delete</GhostBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={hotels.some(h => h.id === editing.id) ? 'Edit hotel' : 'New hotel'}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
            <Field label="Location"><input className={inputCls} value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })}/></Field>
            <Field label="Tagline"><input className={inputCls} value={editing.tagline} onChange={e => setEditing({ ...editing, tagline: e.target.value })}/></Field>
            <Field label="Rating"><input type="number" step="0.1" className={inputCls} value={editing.rating} onChange={e => setEditing({ ...editing, rating: +e.target.value })}/></Field>
            <Field label="Amenities (comma-separated)"><input className={inputCls} defaultValue={editing.amenities.join(', ')} onBlur={e => { setEditing({ ...editing, amenities: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) }); }} /></Field>
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
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-4 sm:p-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl sm:text-3xl mb-4 sm:mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
