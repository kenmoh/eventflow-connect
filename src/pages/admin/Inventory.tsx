import { useStoreBase, fmt, useCurrentEmployee } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import { toast } from 'sonner';
import type { InventoryMovement } from '@/lib/types';
import { useConfirm } from '@/components/ConfirmProvider';

export default function AdminInventory() {
  const rentals = useStoreBase(s => s.rentals);
  const movements = useStoreBase(s => s.movements);
  const set = useStoreBase(s => s.set);
  const addMovement = useStoreBase(s => s.addMovement);
  const me = useCurrentEmployee();
  const role = useStoreBase(s => s.roles.find(r => r.id === me?.roleId));
  const { confirm } = useConfirm();

  const internal = rentals.filter(r => r.ownership === 'internal');
  const lowStock = internal.filter(r => r.stockAvailable === 0 || r.stockAvailable <= r.stockTotal * 0.2);

  const [edit, setEdit] = useState<{ id: string; total: number; available: number; location: string } | null>(null);
  const [mov, setMov] = useState<{ itemId: string; type: InventoryMovement['type']; qty: number; note: string; location: string } | null>(null);

  const saveStock = async () => {
    if (!edit) return;
    const { upsertRental } = await import('@/lib/db');
    const updated = rentals.map(r => r.id === edit.id ? { ...r, stockTotal: edit.total, stockAvailable: edit.available, location: edit.location } : r);
    set('rentals', updated);
    try { await upsertRental(updated.find(r => r.id === edit.id)!); } catch (e: any) { toast.error(e?.message ?? 'Failed to persist stock change'); }
    setEdit(null);
    toast.success('Stock updated.');
  };

  const submitMovement = async () => {
    if (!mov) return;
    const { upsertRental } = await import('@/lib/db');
    const r = rentals.find(x => x.id === mov.itemId)!;
    let delta = 0;
    if (mov.type === 'out' || mov.type === 'damaged') delta = -mov.qty;
    if (mov.type === 'in' || mov.type === 'restock') delta = mov.qty;
    const newAvail = Math.max(0, r.stockAvailable + delta);
    if (mov.type === 'out' && r.stockAvailable < mov.qty) {
      const ok = await confirm({ title: 'Insufficient stock', description: `Only ${r.stockAvailable} available. Continue anyway?`, confirmText: 'Continue' });
      if (!ok) return;
    }
    const updated = { ...r, stockAvailable: newAvail, stockTotal: mov.type === 'damaged' ? Math.max(0, r.stockTotal - mov.qty) : r.stockTotal };
    set('rentals', rentals.map(x => x.id === r.id ? updated : x));
    try { await upsertRental(updated); } catch (e: any) { toast.error(e?.message ?? 'Failed to persist stock change'); }
    addMovement({
      id: crypto.randomUUID(), itemId: r.id, type: mov.type, qty: mov.qty, note: mov.note,
      location: mov.location, handledBy: role?.name ? `${role.name} · ${me?.email ?? ''}` : me?.email ?? '', at: new Date().toISOString(),
    });
    setMov(null);
    toast.success('Movement logged.');
  };

  return (
    <AdminPage title="Inventory" subtitle="Stock, location and check-in/out for in-house equipment.">
      {lowStock.length > 0 && (
        <div className="mb-4 sm:mb-6 border border-gold/40 bg-gold/10 p-3 sm:p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Heads up</div>
          <p className="text-sm mt-1">{lowStock.length} item{lowStock.length === 1 ? '' : 's'} at or near zero stock: {lowStock.map(r => r.name).join(', ')}.</p>
        </div>
      )}

      <div className="border border-border divide-y divide-border bg-card">
        {internal.map(r => {
          const pct = r.stockTotal === 0 ? 0 : Math.round((r.stockAvailable / r.stockTotal) * 100);
          return (
            <div key={r.id} className="grid grid-cols-[50px_1fr] sm:grid-cols-[60px_1fr_auto_auto_auto_auto] gap-2 sm:gap-4 p-3 sm:p-4 items-center">
              <img src={r.image} alt={r.name} className="w-10 h-10 sm:w-14 sm:h-14 object-cover" loading="lazy" />
              <div>
                <div className="font-display text-base sm:text-lg">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.location || '—'} · {fmt(r.pricePerDay)}/day</div>
              </div>
              <div className="sm:text-right min-w-[80px] sm:min-w-[120px] col-span-2 sm:col-auto grid grid-cols-2 sm:block gap-2 sm:gap-0">
                <div className="font-display text-base sm:text-lg">{r.stockAvailable} / {r.stockTotal}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:block hidden">Available</div>
              </div>
              <div className="w-16 sm:w-24 col-span-2 sm:col-auto">
                <div className="h-1.5 bg-secondary border border-border">
                  <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <GhostBtn onClick={() => setMov({ itemId: r.id, type: 'out', qty: 1, note: '', location: '' })} className="text-xs py-1 px-2 sm:py-2 sm:px-4">Move</GhostBtn>
              <GhostBtn onClick={() => setEdit({ id: r.id, total: r.stockTotal, available: r.stockAvailable, location: r.location })} className="text-xs py-1 px-2 sm:py-2 sm:px-4">Edit</GhostBtn>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-2xl sm:text-3xl mt-8 sm:mt-12 mb-3 sm:mb-4">Recent movements</h2>
      <div className="border border-border bg-card divide-y divide-border">
        {movements.length === 0 && <p className="p-4 sm:p-6 text-muted-foreground">No movements yet.</p>}
        {movements.slice(0, 30).map(m => {
          const r = rentals.find(x => x.id === m.itemId);
          return (
            <div key={m.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[140px_1fr_auto_auto] gap-2 sm:gap-4 p-3 sm:p-4 items-center text-sm">
              <div>
                <div className="font-medium">{r?.name ?? m.itemId}</div>
                <div className="text-xs text-muted-foreground">
                  {m.note}
                  {m.location && ` · ${m.type === 'in' ? 'from' : 'to'} ${m.location}`}
                  {m.handledBy && ` · by ${m.handledBy}`}
                  {m.reference && ` · ${m.reference}`}
                </div>
              </div>
              <span className={`text-[10px] uppercase tracking-[0.3em] px-2 py-1 ${m.type === 'out' || m.type === 'damaged' ? 'bg-destructive/20 text-destructive' : 'bg-gold/20 text-gold'}`}>{m.type}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground hidden sm:block">{new Date(m.at).toLocaleString()}</span>
              <span className="font-display hidden sm:block">{m.type === 'out' || m.type === 'damaged' ? '−' : '+'}{m.qty}</span>
            </div>
          );
        })}
      </div>

      {edit && (
        <Modal onClose={() => setEdit(null)} title="Edit stock">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Total"><input type="number" min={0} className={inputCls} value={edit.total} onChange={e => setEdit({ ...edit, total: +e.target.value })}/></Field>
            <Field label="Available"><input type="number" min={0} className={inputCls} value={edit.available} onChange={e => setEdit({ ...edit, available: +e.target.value })}/></Field>
            <div className="md:col-span-2"><Field label="Location"><input className={inputCls} value={edit.location} onChange={e => setEdit({ ...edit, location: e.target.value })} placeholder="Warehouse A · Bay 1"/></Field></div>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <GhostBtn onClick={() => setEdit(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveStock}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {mov && (
        <Modal onClose={() => setMov(null)} title="Log movement">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Type">
              <select className={`${inputCls} bg-card text-foreground [&>option]:bg-card [&>option]:text-foreground`} value={mov.type} onChange={e => setMov({ ...mov, type: e.target.value as InventoryMovement['type'] })}>
                <option value="out">Check out</option>
                <option value="in">Check in (return)</option>
                <option value="restock">Restock</option>
                <option value="damaged">Damaged / lost</option>
              </select>
            </Field>
            <Field label="Quantity"><input type="number" min={1} className={inputCls} value={mov.qty} onChange={e => setMov({ ...mov, qty: +e.target.value })}/></Field>
            <Field label={mov.type === 'in' ? 'Returned from' : 'Going to'}>
              <input className={inputCls} value={mov.location} onChange={e => setMov({ ...mov, location: e.target.value })} placeholder="Venue / address"/>
            </Field>
            <Field label="Handled by">
              <input className={inputCls} value={role?.name ? `${role.name} · ${me?.email ?? ''}` : me?.email ?? ''} disabled />
            </Field>
            <div className="md:col-span-2"><Field label="Note"><input className={inputCls} value={mov.note} onChange={e => setMov({ ...mov, note: e.target.value })} placeholder="Reason / event"/></Field></div>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <GhostBtn onClick={() => setMov(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={submitMovement}>Log</PrimaryBtn>
          </div>
        </Modal>
      )}
    </AdminPage>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-4 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-2xl sm:text-3xl mb-4 sm:mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
