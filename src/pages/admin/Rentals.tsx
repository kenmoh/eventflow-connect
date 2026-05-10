import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import ImagePicker from '@/components/ImagePicker';
import { useState } from 'react';
import type { RentalItem, RentalCategory } from '@/lib/types';
import { toast } from 'sonner';
import heroRentals from '@/assets/hero-rentals.jpg';
import { useConfirm } from '@/components/ConfirmProvider';
import { upsertRental, deleteRental } from '@/lib/db';

const CATS: RentalCategory[] = ['Sound', 'Lighting', 'Seating', 'Tents', 'Decor'];
const blank = (): RentalItem => ({ id: crypto.randomUUID(), name: '', category: 'Sound', pricePerDay: 50000, ownership: 'internal', depositPct: 100, image: heroRentals, description: '', available: true, stockTotal: 1, stockAvailable: 1, location: '' });

export default function AdminRentals() {
  const rentals = useStoreBase(s => s.rentals);
  const set = useStoreBase(s => s.set);
  const [editing, setEditing] = useState<RentalItem | null>(null);
  const { confirm } = useConfirm();

  const save = () => {
    if (!editing) return;
    const it = { ...editing, depositPct: editing.ownership === 'internal' ? 100 : Math.min(100, Math.max(50, editing.depositPct)) };
    const exists = rentals.some(r => r.id === it.id);
    set('rentals', exists ? rentals.map(r => r.id === it.id ? it : r) : [...rentals, it]);
    setEditing(null); toast.success('Saved.');
  };
  const remove = async (id: string) => {
    if (await confirm({ title: 'Delete item?', destructive: true, confirmText: 'Delete' })) set('rentals', rentals.filter(r => r.id !== id));
  };

  return (
    <AdminPage title="Rentals" subtitle="Internal pays 100% upfront. Vendor pays a deposit."
      action={<PrimaryBtn onClick={() => setEditing(blank())}>+ New rental</PrimaryBtn>}>
      <div className="border border-border divide-y divide-border bg-card">
        {rentals.map(r => (
          <div key={r.id} className="grid grid-cols-[60px_1fr_auto_auto_auto] gap-4 p-4 items-center">
            <img src={r.image} alt={r.name} className="w-14 h-14 object-cover" loading="lazy"/>
            <div>
              <div className="font-display text-lg">{r.name}</div>
              <div className="text-xs text-muted-foreground">{r.category}{r.ownership === 'internal' && ` · ${r.stockAvailable}/${r.stockTotal} in stock`}</div>
            </div>
            <span className={`text-[10px] uppercase tracking-[0.3em] px-2 py-1 ${r.ownership === 'internal' ? 'bg-foreground/10' : 'bg-gold text-ink'}`}>
              {r.ownership === 'internal' ? '100%' : `${r.depositPct}%`}
            </span>
            <div className="font-display">{fmt(r.pricePerDay)}/d</div>
            <div className="flex gap-2">
              <GhostBtn onClick={() => setEditing(r)}>Edit</GhostBtn>
              <GhostBtn onClick={() => remove(r.id)}>Delete</GhostBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title="Rental item">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name"><input className={inputCls} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></Field>
            <Field label="Category">
              <select className={inputCls} value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value as RentalCategory })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price / day (NGN)"><input type="number" className={inputCls} value={editing.pricePerDay} onChange={e => setEditing({ ...editing, pricePerDay: +e.target.value })}/></Field>
            <Field label="Ownership">
              <select className={inputCls} value={editing.ownership} onChange={e => setEditing({ ...editing, ownership: e.target.value as 'internal' | 'vendor', depositPct: e.target.value === 'internal' ? 100 : 70 })}>
                <option value="internal">Internal (100%)</option>
                <option value="vendor">Vendor (deposit)</option>
              </select>
            </Field>
            {editing.ownership === 'vendor' && (
              <Field label="Deposit %"><input type="number" min={50} max={100} className={inputCls} value={editing.depositPct} onChange={e => setEditing({ ...editing, depositPct: +e.target.value })}/></Field>
            )}
            {editing.ownership === 'internal' && (
              <>
                <Field label="Stock total"><input type="number" min={0} className={inputCls} value={editing.stockTotal} onChange={e => setEditing({ ...editing, stockTotal: +e.target.value })}/></Field>
                <Field label="Stock available"><input type="number" min={0} className={inputCls} value={editing.stockAvailable} onChange={e => setEditing({ ...editing, stockAvailable: +e.target.value })}/></Field>
                <Field label="Storage location"><input className={inputCls} value={editing.location} onChange={e => setEditing({ ...editing, location: e.target.value })} placeholder="Warehouse A · Bay 1"/></Field>
              </>
            )}
            <div className="md:col-span-2"><Field label="Description"><input className={inputCls} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })}/></Field></div>
            <Field label="Available">
              <select className={inputCls} value={editing.available ? 'yes' : 'no'} onChange={e => setEditing({ ...editing, available: e.target.value === 'yes' })}>
                <option value="yes">Yes</option><option value="no">No</option>
              </select>
            </Field>
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
