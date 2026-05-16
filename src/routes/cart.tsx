import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2 } from 'lucide-react'
import SiteLayout from '@/components/SiteLayout'
import { useStore, fmt } from '@/lib/store'

export const Route = createFileRoute('/cart')({
  head: () => ({
    meta: [
      { title: "Your Cart — AB Consult" },
      { name: "description", content: "Review your equipment rental cart before checkout." },
      { property: "og:title", content: "Your Cart — AB Consult" },
      { property: "og:url", content: "https://abconsult.com/cart" },
    ],
  }),
  component: Cart,
})

function Cart() {
  const { store, updateCart, removeCart } = useStore();
  const lines = store.cart.map(c => ({ ...c, item: store.rentals.find(r => r.id === c.itemId)! })).filter(l => l.item);

  const internal = lines.filter(l => l.item.ownership === 'internal');
  const vendor = lines.filter(l => l.item.ownership === 'vendor');

  const sumGroup = (g: typeof lines) => g.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days, 0);
  const internalTotal = sumGroup(internal);
  const vendorTotal = sumGroup(vendor);
  const internalDue = internalTotal;
  const vendorDue = Math.round(vendor.reduce((a, l) => a + l.item.pricePerDay * l.quantity * l.days * (l.item.depositPct / 100), 0));
  const balance = vendorTotal - vendorDue;
  const grand = internalTotal + vendorTotal;
  const dueNow = internalDue + vendorDue;

  return (
    <SiteLayout>
      <section className="pt-32 pb-12 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Cart</div>
          <h1 className="font-display text-6xl md:text-7xl">The order.</h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-12">
          {lines.length === 0 && (
            <div className="border border-border p-10 text-center">
              <p className="text-muted-foreground">Your cart is empty.</p>
              <Link to="/rentals" className="mt-4 inline-block underline">Browse rentals</Link>
            </div>
          )}
          {[
            { title: 'Fulfilled by us', sub: '100% upfront', group: internal, total: internalTotal, due: internalDue },
            { title: 'Partner vendors', sub: 'Deposit now, balance on confirmation', group: vendor, total: vendorTotal, due: vendorDue },
          ].filter(g => g.group.length > 0).map(g => (
            <div key={g.title}>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-display text-3xl">{g.title}</h2>
                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{g.sub}</span>
              </div>
              <div className="border border-border divide-y divide-border">
                {g.group.map(l => (
                  <div key={l.itemId} className="grid grid-cols-[80px_1fr_auto] gap-4 p-4 items-center">
                    <img src={l.item.image} alt={l.item.name} className="w-20 h-20 object-cover" loading="lazy" width={80} height={80}/>
                    <div>
                      <div className="font-display text-xl">{l.item.name}</div>
                      <div className="text-xs text-muted-foreground">{fmt(l.item.pricePerDay)} / day</div>
                      <div className="mt-2 flex gap-3 text-xs">
                        <label>Qty <input type="number" min={1} value={l.quantity} onChange={e => updateCart(l.itemId, { quantity: Math.max(1, +e.target.value) })} className="ml-1 w-14 border border-border px-2 py-1 bg-transparent"/></label>
                        <label>Days <input type="number" min={1} value={l.days} onChange={e => updateCart(l.itemId, { days: Math.max(1, +e.target.value) })} className="ml-1 w-14 border border-border px-2 py-1 bg-transparent"/></label>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg">{fmt(l.item.pricePerDay * l.quantity * l.days)}</div>
                      <button onClick={() => removeCart(l.itemId)} className="text-muted-foreground hover:text-destructive mt-2 inline-flex items-center gap-1 text-xs">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 bg-ink text-bone p-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-3">Summary</div>
            <h3 className="font-display text-3xl mb-6">Pay smartly. Split clearly.</h3>
            <div className="space-y-3 text-sm">
              <Row k="Internal items" v={fmt(internalTotal)} />
              <Row k="Vendor items" v={fmt(vendorTotal)} />
              <div className="hairline border-bone/15 my-3" />
              <Row k="Total" v={fmt(grand)} />
              <Row k="Due now" v={fmt(dueNow)} accent />
              <Row k="Balance later" v={fmt(balance)} muted />
            </div>
            <Link to="/checkout"
              className={`mt-6 block text-center bg-gold text-ink py-4 text-xs uppercase tracking-[0.3em] hover:bg-gold/90 transition ${lines.length === 0 ? 'pointer-events-none opacity-40' : ''}`}>
              Checkout
            </Link>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}

function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-gold text-base' : muted ? 'text-bone/60' : 'text-bone/90'}`}>
      <span>{k}</span><span className="font-display">{v}</span>
    </div>
  );
}
