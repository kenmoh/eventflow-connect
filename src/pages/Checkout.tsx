import SiteLayout from '@/components/SiteLayout';
import { useStore, makeReference, fmt } from '@/lib/store';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Checkout() {
  const { store, addBooking, clearCart } = useStore();
  const nav = useNavigate();
  const lines = store.cart.map(c => ({ ...c, item: store.rentals.find(r => r.id === c.itemId)! })).filter(l => l.item);
  const total = lines.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days, 0);
  const dueNow = lines.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days * (l.item.ownership === 'internal' ? 1 : l.item.depositPct / 100), 0);
  const balance = total - dueNow;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [method, setMethod] = useState<'card' | 'transfer' | 'mobile'>('card');

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <div className="pt-40 mx-auto max-w-[1400px] px-6 lg:px-10">
          <p>Your cart is empty. <Link to="/rentals" className="underline">Browse</Link></p>
        </div>
      </SiteLayout>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date) { toast.error('Please complete all fields.'); return; }
    const ref = makeReference();
    addBooking({
      reference: ref,
      createdAt: new Date().toISOString(),
      type: 'rental',
      customer: { name, email, phone },
      details: { items: lines.map(l => ({ name: l.item.name, qty: l.quantity, days: l.days, ownership: l.item.ownership })), address, date, method },
      total,
      amountPaid: Math.round(dueNow),
      balanceDue: Math.round(balance),
      paymentStatus: balance > 0 ? 'deposit' : 'paid',
      fulfillment: 'pending',
    });
    clearCart();
    toast.success('Payment received. Booking confirmed.');
    nav(`/track?ref=${ref}`);
  };

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Checkout</div>
          <h1 className="font-display text-6xl md:text-7xl">A few quiet details.</h1>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <Section n="01" title="Contact">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name"><input value={name} onChange={e => setName(e.target.value)} className="field"/></Field>
              <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field"/></Field>
              <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className="field"/></Field>
              <Field label="Event date"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="field"/></Field>
            </div>
          </Section>
          <Section n="02" title="Delivery">
            <Field label="Delivery address"><input value={address} onChange={e => setAddress(e.target.value)} className="field" placeholder="Venue or street address"/></Field>
          </Section>
          <Section n="03" title="Payment">
            <div className="grid grid-cols-3 gap-2">
              {(['card', 'transfer', 'mobile'] as const).map(m => (
                <button key={m} type="button" onClick={() => setMethod(m)}
                  className={`py-4 text-xs uppercase tracking-[0.25em] border ${method === m ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                  {m === 'card' ? 'Card' : m === 'transfer' ? 'Bank transfer' : 'Mobile money'}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Payments are simulated in this demo.</p>
          </Section>
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 bg-ink text-bone p-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-4">Order</div>
            <ul className="space-y-3 text-sm">
              {lines.map(l => (
                <li key={l.itemId} className="flex justify-between gap-4">
                  <span className="flex-1">{l.item.name} <span className="text-bone/50">× {l.quantity} · {l.days}d</span></span>
                  <span className="font-display">{fmt(l.item.pricePerDay * l.quantity * l.days)}</span>
                </li>
              ))}
            </ul>
            <div className="hairline border-bone/15 my-5" />
            <div className="space-y-2 text-sm">
              <Row k="Total" v={fmt(total)} />
              <Row k="Due now" v={fmt(dueNow)} accent />
              <Row k="Balance later" v={fmt(balance)} muted />
            </div>
            <button type="submit" className="mt-6 w-full bg-gold text-ink py-4 text-xs uppercase tracking-[0.3em] hover:bg-gold/90 transition">
              Pay {fmt(dueNow)}
            </button>
          </div>
        </aside>
      </form>

      <style>{`.field { width:100%; background:transparent; border:1px solid hsl(var(--border)); padding:.7rem .8rem; outline:none; font:inherit; color:inherit; } .field:focus { border-color: hsl(var(--gold)); }`}</style>
    </SiteLayout>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border p-6">
      <div className="flex items-baseline gap-4 mb-4">
        <span className="font-display text-3xl text-gold">{n}</span>
        <h2 className="font-display text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-gold text-base' : muted ? 'text-bone/60' : 'text-bone/90'}`}>
      <span>{k}</span><span className="font-display">{v}</span>
    </div>
  );
}
