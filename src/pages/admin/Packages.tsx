import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Pkg, PackageKind, TimeSlot } from '@/lib/types';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmProvider';
import { X } from 'lucide-react';

const blank = (hotelId: string): Pkg => ({
  id: crypto.randomUUID(), hotelId, kind: 'coffee', name: '', description: '',
  items: [], pricePerPerson: 15000,
  timeSlots: [{ id: crypto.randomUUID(), label: 'Morning', time: '10:00' }],
});

export default function AdminPackages() {
  const packages = useStoreBase(s => s.packages);
  const hotels = useStoreBase(s => s.hotels);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const { confirm } = useConfirm();

  const save = () => {
    if (!editing) return;
    if (!editing.hotelId) { toast.error('Pick a hotel.'); return; }
    const exists = packages.some(p => p.id === editing.id);
    set('packages', exists ? packages.map(p => p.id === editing.id ? editing : p) : [...packages, editing]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete package?', destructive: true, confirmText: 'Delete' })) {
      set('packages', packages.filter(p => p.id !== id));
    }
  };

  const updateSlot = (idx: number, patch: Partial<TimeSlot>) => {
    if (!editing) return;
    setEditing({ ...editing, timeSlots: editing.timeSlots.map((s, i) => i === idx ? { ...s, ...patch } : s) });
  };
  const addSlot = () => {
    if (!editing) return;
    setEditing({ ...editing, timeSlots: [...editing.timeSlots, { id: crypto.randomUUID(), label: 'New', time: '12:00' }] });
  };
  const removeSlot = (id: string) => {
    if (!editing) return;
    setEditing({ ...editing, timeSlots: editing.timeSlots.filter(s => s.id !== id) });
  };

  return (
    <AdminPage title="Packages" subtitle="Coffee breaks and full food packages, scoped to each hotel."
      action={<PrimaryBtn onClick={() => setEditing(blank(hotels[0]?.id || ''))}>+ New package</PrimaryBtn>}>
      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((p, i) => {
          const h = hotels.find(x => x.id === p.hotelId);
          return (
            <div key={p.id} className="border border-border p-5 bg-card">
              <div className="flex items-center justify-between">
                <span className="chip">{p.kind === 'coffee' ? 'Coffee' : 'Food'}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">0{i+1}</span>
              </div>
              <div className="font-display text-2xl mt-2">{p.name}</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold mt-1">{h?.name ?? '—'}</div>
              <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
              <div className="mt-3 font-display">{fmt(p.pricePerPerson)} <span className="text-xs text-muted-foreground">/pp</span></div>
              <div className="mt-2 flex flex-wrap gap-1">
                {p.timeSlots.map(t => <span key={t.id} className="chip">{t.label} · {t.time}</span>)}
              </div>
              <ul className="mt-3 text-xs text-muted-foreground space-y-1">{p.items.map(it => <li key={it}>— {it}</li>)}</ul>
              <div className="mt-4 flex gap-2">
                <GhostBtn onClick={() => setEditing(p)}>Edit</GhostBtn>
                <GhostBtn onClick={() => remove(p.id)}>Delete</GhostBtn>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={() => setEditing(null)}>
          <div className="bg-card w-full max-w-3xl p-8 border border-border max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-3xl mb-6">Package</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Hotel">
                <select className={inputCls} value={editing.hotelId} onChange={e => setEditing({ ...editing, hotelId: e.target.value })}>
                  <option value="">— pick —</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select className={inputCls} value={editing.kind} onChange={e => setEditing({ ...editing, kind: e.target.value as PackageKind })}>
                  <option value="coffee">Coffee / snacks</option>
                  <option value="food">Food / meal</option>
                </select>
              </Field>
              <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
              <Field label="Price / person (NGN)"><input type="number" className={inputCls} value={editing.pricePerPerson} onChange={e => setEditing({ ...editing, pricePerPerson: +e.target.value })}/></Field>
              <div className="md:col-span-2"><Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field></div>
              <div className="md:col-span-2">
                <Field label="Items (one per line — Enter for new line)">
                  <textarea rows={6} className={inputCls} value={editing.items.join('\n')}
                    onChange={e => setEditing({ ...editing, items: e.target.value.split('\n') })}
                    onBlur={e => setEditing({ ...editing, items: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}/>
                </Field>
              </div>
              <div className="md:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">Time slots</span>
                <div className="space-y-2">
                  {editing.timeSlots.map((s, i) => (
                    <div key={s.id} className="grid grid-cols-[1fr_140px_auto] gap-2 items-center">
                      <input className={inputCls} placeholder="Label e.g. Morning" value={s.label} onChange={e => updateSlot(i, { label: e.target.value })}/>
                      <input type="time" className={inputCls} value={s.time} onChange={e => updateSlot(i, { time: e.target.value })}/>
                      <button type="button" onClick={() => removeSlot(s.id)} className="text-muted-foreground hover:text-destructive p-2"><X className="w-4 h-4"/></button>
                    </div>
                  ))}
                  <GhostBtn type="button" onClick={addSlot}>+ Add slot</GhostBtn>
                </div>
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
