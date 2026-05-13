import SiteLayout from '@/components/SiteLayout';
import { useStoreBase, makeReference, fmt } from '@/lib/store';
import { insertBooking, insertMovement, adjustStock, lookupCustomer } from '@/lib/db';
import { useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { checkoutSchema } from '@/lib/validation';
import { useConfirm } from '@/components/ConfirmProvider';
import { ShieldCheck, CreditCard, Smartphone, Building2 } from 'lucide-react';

const METHODS = [
  { id: 'flutterwave-card', label: 'Card', icon: CreditCard, sub: 'Visa · Mastercard · Verve' },
  { id: 'flutterwave-transfer', label: 'Bank transfer', icon: Building2, sub: 'Direct from your bank' },
  { id: 'flutterwave-ussd', label: 'USSD / Mobile', icon: Smartphone, sub: 'Pay from any phone' },
] as const;

export default function Checkout() {
  const cart = useStoreBase(s => s.cart);
  const rentals = useStoreBase(s => s.rentals);
  const addBooking = useStoreBase(s => s.addBooking);
  const addMovement = useStoreBase(s => s.addMovement);
  const set = useStoreBase(s => s.set);
  const clearCart = useStoreBase(s => s.clearCart);
  const allRentals = useStoreBase(s => s.rentals);
  const nav = useNavigate();
  const { alert: alertDialog } = useConfirm();

  const lines = cart
    .map(c => ({ ...c, item: rentals.find(r => r.id === c.itemId)! }))
    .filter(l => l.item);
  const total = lines.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days, 0);
  const dueNow = lines.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days * (l.item.ownership === 'internal' ? 1 : l.item.depositPct / 100), 0);
  const balance = total - dueNow;

  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', date: '', method: 'flutterwave-card' as typeof METHODS[number]['id'] });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <div className="pt-40 mx-auto max-w-[1400px] px-6 lg:px-10">
          <p>Your cart is empty. <Link to="/rentals" className="underline text-gold">Browse rentals</Link></p>
        </div>
      </SiteLayout>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkoutSchema.safeParse(form);
    if (!res.success) {
      const map: Record<string, string> = {};
      res.error.issues.forEach(i => { map[i.path.join('.')] = i.message; });
      setErrors(map);
      return;
    }
    setErrors({});
    setPaying(true);
    // Simulated Flutterwave flow
    await new Promise(r => setTimeout(r, 1400));
    setPaying(false);

    const ref = makeReference();
    addBooking({
      reference: ref,
      createdAt: new Date().toISOString(),
      type: 'rental',
      customer: { name: form.name, email: form.email, phone: form.phone },
      details: {
        items: lines.map(l => ({ name: l.item.name, qty: l.quantity, days: l.days, ownership: l.item.ownership })),
        address: form.address, date: form.date, method: form.method,
      },
      total, amountPaid: Math.round(dueNow), balanceDue: Math.round(balance),
      paymentStatus: balance > 0 ? 'deposit' : 'paid',
      fulfillment: 'pending',
    });

    // Decrement internal inventory + log movement
    const updatedRentals = allRentals.map(r => {
      const line = lines.find(l => l.itemId === r.id);
      if (!line || r.ownership !== 'internal') return r;
      const newAvail = Math.max(0, r.stockAvailable - line.quantity);
      return { ...r, stockAvailable: newAvail };
    });
    set('rentals', updatedRentals);
    lines.filter(l => l.item.ownership === 'internal').forEach(l => {
      addMovement({
        id: crypto.randomUUID(),
        itemId: l.itemId, type: 'out', qty: l.quantity,
        note: `Checkout · ${l.days} day(s)`,
        reference: ref, at: new Date().toISOString(),
      });
    });

    clearCart();
    await alertDialog({
      title: 'Payment successful',
      description: `Reference ${ref}. We've also emailed your receipt to ${form.email}.`,
      confirmText: 'View booking',
    });
    toast.success('Booking confirmed.');
    nav(`/track?ref=${ref}`);
  };

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Checkout</div>
          <h1 className="font-display text-6xl md:text-7xl">A few quiet details.</h1>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <Section n="01" title="Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name" error={errors.name}><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field"/></Field>
              <Field label="Email" error={errors.email}><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="field"/></Field>
              <Field label="Phone" error={errors.phone}><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="field"/></Field>
              <Field label="Event date" error={errors.date}><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="field"/></Field>
            </div>
          </Section>
          <Section n="02" title="Delivery">
            <Field label="Delivery address" error={errors.address}>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="field" placeholder="Venue or street address"/>
            </Field>
          </Section>
          <Section n="03" title="Payment method">
            <div className="grid sm:grid-cols-3 gap-2">
              {METHODS.map(m => (
                <button key={m.id} type="button" onClick={() => setForm({ ...form, method: m.id })}
                  className={`p-4 text-left border transition ${form.method === m.id ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                  <m.icon className="w-5 h-5 text-gold" />
                  <div className="mt-3 font-display text-lg">{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.sub}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Secured by Flutterwave · Test mode (no real charge)
            </div>
          </Section>
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 bg-card border border-border p-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-4">Order</div>
            <ul className="space-y-3 text-sm">
              {lines.map(l => (
                <li key={l.itemId} className="flex justify-between gap-4">
                  <span className="flex-1">{l.item.name} <span className="text-muted-foreground">× {l.quantity} · {l.days}d</span></span>
                  <span className="font-display">{fmt(l.item.pricePerDay * l.quantity * l.days)}</span>
                </li>
              ))}
            </ul>
            <div className="hairline my-5" />
            <div className="space-y-2 text-sm">
              <Row k="Total" v={fmt(total)} />
              <Row k="Due now" v={fmt(dueNow)} accent />
              <Row k="Balance later" v={fmt(balance)} muted />
            </div>
            <button type="submit" disabled={paying}
              className="mt-6 w-full bg-gold text-ink py-4 text-xs uppercase tracking-[0.3em] hover:bg-gold/90 transition disabled:opacity-60">
              {paying ? 'Connecting to Flutterwave…' : `Pay ${fmt(dueNow)} with Flutterwave`}
            </button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center">
              Tracked by email · No sign-up
            </p>
          </div>
        </aside>
      </form>
    </SiteLayout>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-display text-3xl text-gold">{n}</span>
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">{label}</span>
      {children}
      {error && <span className="text-destructive text-xs mt-1 block">{error}</span>}
    </label>
  );
}
function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-gold text-base' : muted ? 'text-muted-foreground' : 'text-foreground/90'}`}>
      <span>{k}</span><span className="font-display">{v}</span>
    </div>
  );
}
