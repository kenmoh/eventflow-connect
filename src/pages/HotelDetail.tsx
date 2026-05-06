import SiteLayout from '@/components/SiteLayout';
import { useStore, makeReference, fmt } from '@/lib/store';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';

export default function HotelDetail() {
  const { id } = useParams();
  const { store, addBooking } = useStore();
  const nav = useNavigate();
  const hotel = store.hotels.find(h => h.id === id);
  const rooms = store.rooms.filter(r => r.hotelId === id);
  const halls = store.halls.filter(h => h.hotelId === id);
  const packages = store.packages;

  const [tab, setTab] = useState<'rooms' | 'halls'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string>(rooms[0]?.id || '');
  const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.id || '');
  const [selectedPkg, setSelectedPkg] = useState<string>('');
  const [people, setPeople] = useState(20);
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!hotel) {
    return (
      <SiteLayout>
        <div className="pt-40 mx-auto max-w-[1400px] px-6 lg:px-10">
          <p>Hotel not found. <Link to="/hotels" className="underline">Back</Link></p>
        </div>
      </SiteLayout>
    );
  }

  const room = rooms.find(r => r.id === selectedRoom);
  const hall = halls.find(h => h.id === selectedHall);
  const pkg = packages.find(p => p.id === selectedPkg);

  const subtotal = tab === 'rooms'
    ? (room?.price || 0)
    : ((hall?.pricePerHour || 0) * 4) + (pkg ? pkg.pricePerPerson * people : 0);
  const deposit = Math.round(subtotal * 0.5);

  const submit = () => {
    if (!name || !email || !date) { toast.error('Please complete your details.'); return; }
    const ref = makeReference();
    addBooking({
      reference: ref,
      createdAt: new Date().toISOString(),
      type: 'reservation',
      customer: { name, email, phone },
      details: { hotel: hotel.name, room: room?.type, hall: hall?.name, pkg: pkg?.name, people, date },
      total: subtotal,
      amountPaid: deposit,
      balanceDue: subtotal - deposit,
      paymentStatus: 'deposit',
      fulfillment: 'pending',
    });
    toast.success('Booking confirmed.');
    nav(`/track?ref=${ref}`);
  };

  return (
    <SiteLayout>
      <section className="pt-28">
        <div className="relative h-[70vh] bg-ink">
          <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover opacity-70" width={1920} height={1080}/>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 mx-auto max-w-[1400px] px-6 lg:px-10 pb-12 text-bone">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold">{hotel.location}</div>
            <h1 className="font-display text-6xl md:text-8xl mt-3">{hotel.name}</h1>
            <p className="mt-3 text-bone/80 max-w-xl">{hotel.tagline}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7">
          <div className="flex gap-px bg-border w-fit mb-8">
            {(['rooms', 'halls'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-3 text-xs uppercase tracking-[0.25em] ${tab === t ? 'bg-ink text-bone' : 'bg-background hover:bg-secondary'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'rooms' && (
            <div className="space-y-4">
              {rooms.map(r => (
                <button key={r.id} onClick={() => setSelectedRoom(r.id)}
                  className={`w-full text-left grid grid-cols-[120px_1fr_auto] gap-6 p-4 border ${selectedRoom === r.id ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                  <img src={r.image} alt={r.type} className="w-full h-24 object-cover" width={120} height={96} loading="lazy"/>
                  <div>
                    <div className="font-display text-2xl">{r.type}</div>
                    <p className="text-sm text-muted-foreground">{r.description}</p>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">Sleeps {r.capacity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl">{fmt(r.price)}</div>
                    <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">/night</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {tab === 'halls' && (
            <>
              <div className="space-y-4">
                {halls.map(h => (
                  <button key={h.id} onClick={() => setSelectedHall(h.id)}
                    className={`w-full text-left grid grid-cols-[120px_1fr_auto] gap-6 p-4 border ${selectedHall === h.id ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                    <img src={h.image} alt={h.name} className="w-full h-24 object-cover" width={120} height={96} loading="lazy"/>
                    <div>
                      <div className="font-display text-2xl">{h.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">Capacity {h.capacity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl">{fmt(h.pricePerHour)}</div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">/hour</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12">
                <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Choose a package</div>
                <h2 className="font-display text-3xl mb-6">Three meeting moods.</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {packages.map(p => (
                    <button key={p.id} onClick={() => setSelectedPkg(p.id === selectedPkg ? '' : p.id)}
                      className={`text-left p-5 border ${selectedPkg === p.id ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                      <div className="text-2xl">{p.emoji}</div>
                      <div className="font-display text-xl mt-2">{p.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                      <div className="mt-3 font-display text-lg">{fmt(p.pricePerPerson)} <span className="text-xs text-muted-foreground font-sans">/pp</span></div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Booking panel */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-28 border border-border bg-background p-8">
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Reserve</div>
            <h3 className="font-display text-3xl mb-6">Three minutes, no account.</h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Date">
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field" />
              </Field>
              {tab === 'halls' && (
                <Field label="People">
                  <input type="number" min={1} value={people} onChange={e => setPeople(+e.target.value || 1)} className="field" />
                </Field>
              )}
            </div>
            <Field label="Full name"><input value={name} onChange={e => setName(e.target.value)} className="field" /></Field>
            <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" /></Field>
            <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} className="field" /></Field>

            <div className="mt-6 space-y-2 text-sm">
              <Row k="Subtotal" v={fmt(subtotal)} />
              <Row k="Deposit (50%)" v={fmt(deposit)} accent />
              <Row k="Balance on arrival" v={fmt(subtotal - deposit)} muted />
            </div>

            <button onClick={submit} className="mt-6 w-full bg-ink text-bone py-4 text-xs uppercase tracking-[0.3em] hover:bg-ink/90 transition">
              Confirm — pay deposit
            </button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center">
              Tracked by email · No sign-up
            </p>
          </div>
        </aside>
      </section>

      <style>{`.field { width: 100%; background: transparent; border: 1px solid hsl(var(--border)); padding: 0.7rem 0.8rem; outline: none; font: inherit; color: inherit; } .field:focus { border-color: hsl(var(--gold)); }`}</style>
    </SiteLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">{label}</span>
      {children}
    </label>
  );
}
function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-foreground font-medium' : muted ? 'text-muted-foreground' : ''}`}>
      <span>{k}</span><span className="font-display">{v}</span>
    </div>
  );
}
