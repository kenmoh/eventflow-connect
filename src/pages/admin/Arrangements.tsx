import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import type { SeatArrangement } from '@/lib/types';
import { toast } from 'sonner';
import heroBallroom from '@/assets/hero-ballroom.jpg';
import { useConfirm } from '@/components/ConfirmProvider';

const blank = (): SeatArrangement => ({ id: crypto.randomUUID(), name: '', description: '', image: heroBallroom });

export default function AdminArrangements() {
  const arrangements = useStoreBase(s => s.arrangements);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<SeatArrangement | null>(null);
  const { confirm } = useConfirm();

  const save = async () => {
    if (!editing) return;
    const exists = arrangements.some(a => a.id === editing.id);
    set('arrangements', exists ? arrangements.map(a => a.id === editing.id ? editing : a) : [...arrangements, editing]);
    setEditing(null);
    const { upsertArrangement } = await import('@/lib/db');
    try { await upsertArrangement(editing); toast.success('Saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete arrangement?', destructive: true, confirmText: 'Delete' })) {
      set('arrangements', arrangements.filter(a => a.id !== id));
      const { deleteArrangement } = await import('@/lib/db');
      try { await deleteArrangement(id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  return (
    <AdminPage title="Seat arrangements" subtitle="Layouts customers can pick when booking a hall."
      action={<PrimaryBtn onClick={() => setEditing(blank())}>+ New arrangement</PrimaryBtn>}>
      <div className="grid md:grid-cols-3 gap-4">
        {arrangements.map(a => (
          <div key={a.id} className="border border-border bg-card overflow-hidden">
            <img src={a.image} alt={a.name} className="w-full h-40 object-cover"/>
            <div className="p-4">
              <div className="font-display text-xl">{a.name}</div>
              <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
              <div className="mt-3 flex gap-2">
                <GhostBtn onClick={() => setEditing(a)}>Edit</GhostBtn>
                <GhostBtn onClick={() => remove(a.id)}>Delete</GhostBtn>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-card w-full max-w-2xl p-8 border border-border max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Seat arrangement</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
              <div className="md:col-span-2"><Field label="Description"><textarea rows={3} className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field></div>
              <div className="md:col-span-2"><ImagePicker value={editing.image} onChange={v => setEditing({ ...editing, image: v })}/></div>
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
