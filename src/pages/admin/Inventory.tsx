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
  const { confirm } = useConfirm();

  const internal = rentals.filter(r => r.ownership === 'internal');
  const lowStock = internal.filter(r => r.stockAvailable === 0 || r.stockAvailable <= r.stockTotal * 0.2);

  const [edit, setEdit] = useState<{ id: string; total: number; available: number; location: string } | null>(null);
  const [mov, setMov] = useState<{ itemId: string; type: InventoryMovement['type']; qty: number; note: string; location: string; handledBy: string } | null>(null);

  const saveStock = () => {
    if (!edit) return;
    set('rentals', rentals.map(r => r.id === edit.id ? { ...r, stockTotal: edit.total, stockAvailable: edit.available, location: edit.location } : r));
    setEdit(null);
    toast.success('Stock updated.');
  };

  const submitMovement = async () => {
    if (!mov) return;
    const r = rentals.find(x => x.id === mov.itemId)!;
    let delta = 0;
    if (mov.type === 'out' || mov.type === 'damaged') delta = -mov.qty;
    if (mov.type === 'in' || mov.type === 'restock') delta = mov.qty;
    const newAvail = Math.max(0, r.stockAvailable + delta);
    if (mov.type === 'out' && r.stockAvailable < mov.qty) {
      const ok = await confirm({ title: 'Insufficient stock', description: `Only ${r.stockAvailable} available. Continue anyway?`, confirmText: 'Continue' });
      if (!ok) return;
    }
    set('rentals', rentals.map(x => x.id === r.id ? { ...x, stockAvailable: newAvail, stockTotal: mov.type === 'damaged' ? Math.max(0, x.stockTotal - mov.qty) : x.stockTotal } : x));
    addMovement({
      id: crypto.randomUUID(), itemId: r.id, type: mov.type, qty: mov.qty, note: mov.note,
      location: mov.location, handledBy: mov.handledBy, at: new Date().toISOString(),
    });
    setMov(null);
    toast.success('Movement logged.');
  };

  return (
    <AdminPage title="Inventory" subtitle="Stock, location and check-in/out for in-house equipment.">
      {lowStock.length > 0 && (
        <div className="mb-6 border border-gold/40 bg-gold/10 p-4">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Heads up</div>
          <p className="text-sm mt-1">{lowStock.length} item{lowStock.length === 1 ? '' : 's'} at or near zero stock: {lowStock.map(r => r.name).join(', ')}.</p>
        </div>
      )}

      <div className="border border-border divide-y divide-border bg-card">
        {internal.map(r => {
          const pct = r.stockTotal === 0 ? 0 : Math.round((r.stockAvailable / r.stockTotal) * 100);
          return (
            <div key={r.id} className="grid grid-cols-[60px_1fr_auto_auto_auto_auto] gap-4 p-4 items-center">
              <img src={r.image} alt={r.name} className="w-14 h-14 object-cover" loading="lazy" />
              <div>
                <div className="font-display text-lg">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.location || '—'} · {fmt(r.pricePerDay)}/day</div>
              </div>
              <div className="text-right min-w-[120px]">
                <div className="font-display text-lg">{r.stockAvailable} / {r.stockTotal}</div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Available</div>
              </div>
              <div className="w-24">
                <div className="h-1.5 bg-secondary border border-border">
                  <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <GhostBtn onClick={() => setMov({ itemId: r.id, type: 'out', qty: 1, note: '', location: '', handledBy: me?.name || '' })}>Move</GhostBtn>
              <GhostBtn onClick={() => setEdit({ id: r.id, total: r.stockTotal, available: r.stockAvailable, location: r.location })}>Edit</GhostBtn>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-3xl mt-12 mb-4">Recent movements</h2>
      <div className="border border-border bg-card divide-y divide-border">
        {movements.length === 0 && <p className="p-6 text-muted-foreground">No movements yet.</p>}
        {movements.slice(0, 30).map(m => {
          const r = rentals.find(x => x.id === m.itemId);
          return (
            <div key={m.id} className="grid grid-cols-[140px_1fr_auto_auto] gap-4 p-4 items-center text-sm">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{new Date(m.at).toLocaleString()}</span>
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
              <span className="font-display">{m.type === 'out' || m.type === 'damaged' ? '−' : '+'}{m.qty}</span>
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
              <select className={inputCls} value={mov.type} onChange={e => setMov({ ...mov, type: e.target.value as InventoryMovement['type'] })}>
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
              <input className={inputCls} value={mov.handledBy} onChange={e => setMov({ ...mov, handledBy: e.target.value })} placeholder="Employee name"/>
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
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-8" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-3xl mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
