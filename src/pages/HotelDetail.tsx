import SiteLayout from '@/components/SiteLayout';
import { useStoreBase, makeReference, fmt } from '@/lib/store';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { reservationSchema } from '@/lib/validation';
import { useConfirm } from '@/components/ConfirmProvider';
import { X } from 'lucide-react';
import type { BookingLine } from '@/lib/types';

type PkgPick = { id: string; persons: number; timeSlotId: string };

export default function HotelDetail() {
  const { id } = useParams();
  const hotels = useStoreBase(s => s.hotels);
  const allRooms = useStoreBase(s => s.rooms);
  const allHalls = useStoreBase(s => s.halls);
  const allPackages = useStoreBase(s => s.packages);
  const arrangements = useStoreBase(s => s.arrangements);
  const bookings = useStoreBase(s => s.bookings);
  const addBooking = useStoreBase(s => s.addBooking);
  const nav = useNavigate();
  const { alert: alertDialog } = useConfirm();

  const hotel = hotels.find(h => h.id === id);
  const rooms = allRooms.filter(r => r.hotelId === id);
  const halls = allHalls.filter(h => h.hotelId === id);
  const packages = allPackages.filter(p => p.hotelId === id);

  // Selections — all optional
  const [roomId, setRoomId] = useState<string>('');
  const [nights, setNights] = useState(1);

  const [hallId, setHallId] = useState<string>('');
  const [days, setDays] = useState(1);
  const [hallTime, setHallTime] = useState('10:00');
  const [seatId, setSeatId] = useState<string>(arrangements[0]?.id ?? '');

  const [picks, setPicks] = useState<PkgPick[]>([]);

  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  // Autofill on returning email
  const onEmailBlur = () => {
    if (!email.trim()) return;
    const prior = bookings.find(b => b.customer.email.toLowerCase() === email.trim().toLowerCase());
    if (prior) {
      if (!name) setName(prior.customer.name);
      if (!phone) setPhone(prior.customer.phone);
      toast.success('Welcome back — details prefilled.');
    }
  };

  const lines = useMemo<BookingLine[]>(() => {
    const out: BookingLine[] = [];
    const room = rooms.find(r => r.id === roomId);
    if (room) out.push({ kind: 'room', name: room.type, nights, pricePerNight: room.price, subtotal: room.price * nights });
    const hall = halls.find(h => h.id === hallId);
    if (hall) {
      const seat = arrangements.find(a => a.id === seatId);
      out.push({
        kind: 'hall', name: hall.name, days, pricePerDay: hall.pricePerHour * 8,
        timeSlot: hallTime, seatArrangement: seat?.name,
        subtotal: hall.pricePerHour * 8 * days,
      });
    }
    picks.forEach(pk => {
      const p = packages.find(x => x.id === pk.id); if (!p) return;
      const slot = p.timeSlots.find(t => t.id === pk.timeSlotId);
      out.push({
        kind: 'package', name: p.name, persons: pk.persons, pricePerPerson: p.pricePerPerson,
        timeSlot: slot ? `${slot.label} · ${slot.time}` : undefined,
        subtotal: p.pricePerPerson * pk.persons,
      });
    });
    return out;
  }, [roomId, nights, hallId, days, hallTime, seatId, picks, rooms, halls, packages, arrangements]);

  const total = lines.reduce((a, l) => a + l.subtotal, 0);
  const deposit = Math.round(total * 0.5);

  if (!hotel) {
    return (
      <SiteLayout>
        <div className="pt-40 mx-auto max-w-[1400px] px-6 lg:px-10">
          <p>Hotel not found. <Link to="/hotels" className="underline">Back</Link></p>
        </div>
      </SiteLayout>
    );
  }

  const removeLine = (l: BookingLine) => {
    if (l.kind === 'room') setRoomId('');
    else if (l.kind === 'hall') setHallId('');
    else if (l.kind === 'package') {
      const p = packages.find(x => x.name === l.name);
      if (p) setPicks(prev => prev.filter(x => x.id !== p.id));
    }
  };

  const togglePick = (pkgId: string) => {
    setPicks(p => p.some(x => x.id === pkgId)
      ? p.filter(x => x.id !== pkgId)
      : [...p, { id: pkgId, persons: 20, timeSlotId: packages.find(pk => pk.id === pkgId)?.timeSlots[0]?.id ?? '' }]);
  };
  const updatePick = (pkgId: string, patch: Partial<PkgPick>) =>
    setPicks(p => p.map(x => x.id === pkgId ? { ...x, ...patch } : x));

  const submit = async () => {
    if (lines.length === 0) {
      toast.error('Add at least a room, a hall or a package.');
      return;
    }
    const res = reservationSchema.safeParse({ name, email, phone, date });
    if (!res.success) {
      const map: Record<string, string> = {};
      res.error.issues.forEach(i => { map[i.path.join('.')] = i.message; });
      setErrors(map);
      return;
    }
    setErrors({});
    setPaying(true);
    await new Promise(r => setTimeout(r, 1200));
    setPaying(false);

    const ref = makeReference();
    addBooking({
      reference: ref,
      createdAt: new Date().toISOString(),
      type: 'reservation',
      customer: { name, email, phone },
      details: { hotel: hotel.name, date },
      lines,
      total, amountPaid: deposit, balanceDue: total - deposit,
      paymentStatus: 'deposit', fulfillment: 'pending',
    });

    await alertDialog({
      title: 'Reservation confirmed',
      description: `Reference ${ref}. Deposit of ${fmt(deposit)} captured via Flutterwave (test mode).`,
      confirmText: 'View booking',
    });
    toast.success('Reservation confirmed.');
    nav(`/track?ref=${ref}`);
  };

  const selectedHall = halls.find(h => h.id === hallId);

  return (
    <SiteLayout>
      <section className="pt-28">
        <div className="relative h-[60vh] bg-ink">
          <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover opacity-60" width={1920} height={1080}/>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 mx-auto max-w-[1400px] px-6 lg:px-10 pb-12 text-ink-foreground">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold">{hotel.location}</div>
            <h1 className="font-display text-6xl md:text-8xl mt-3">{hotel.name}</h1>
            <p className="mt-3 opacity-80 max-w-xl">{hotel.tagline}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-14">
          {/* ROOMS */}
          <div>
            <SectionTitle eyebrow="Optional" title="Rooms" />
            <div className="space-y-3">
              {rooms.map(r => {
                const sel = r.id === roomId;
                return (
                  <div key={r.id}
                    className={`grid grid-cols-[120px_1fr_auto] gap-6 p-4 border ${sel ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                    <button type="button" onClick={() => setRoomId(sel ? '' : r.id)} className="contents text-left">
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
                    {sel && (
                      <div className="col-span-3 flex items-center gap-3 pt-3 border-t border-border">
                        <label className="text-xs">Nights
                          <input type="number" min={1} value={nights} onChange={e => setNights(Math.max(1, +e.target.value))}
                            className="ml-2 w-20 field" /></label>
                        <span className="text-sm text-muted-foreground">Subtotal {fmt(r.price * nights)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {rooms.length === 0 && <p className="text-muted-foreground">No rooms listed yet.</p>}
            </div>
          </div>

          {/* HALLS */}
          <div>
            <SectionTitle eyebrow="Optional" title="Event halls" />
            <div className="space-y-3">
              {halls.map(h => {
                const sel = h.id === hallId;
                return (
                  <div key={h.id}
                    className={`grid grid-cols-[120px_1fr_auto] gap-6 p-4 border ${sel ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                    <button type="button" onClick={() => setHallId(sel ? '' : h.id)} className="contents text-left">
                      <img src={h.image} alt={h.name} className="w-full h-24 object-cover" width={120} height={96} loading="lazy"/>
                      <div>
                        <div className="font-display text-2xl">{h.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">Capacity {h.capacity}</div>
                        {h.amenities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.amenities.map(a => <span key={a} className="chip">{a}</span>)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-display text-2xl">{fmt(h.pricePerHour * 8)}</div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">/day (8h)</div>
                      </div>
                    </button>
                    {sel && (
                      <div className="col-span-3 grid sm:grid-cols-2 gap-3 pt-3 border-t border-border">
                        <label className="text-xs">Days
                          <input type="number" min={1} value={days} onChange={e => setDays(Math.max(1, +e.target.value))}
                            className="ml-2 w-20 field" /></label>
                        <label className="text-xs">Start time
                          <input type="time" value={hallTime} onChange={e => setHallTime(e.target.value)}
                            className="ml-2 w-32 field" /></label>
                      </div>
                    )}
                  </div>
                );
              })}
              {halls.length === 0 && <p className="text-muted-foreground">No halls listed yet.</p>}
            </div>
          </div>

          {/* PACKAGES */}
          <div>
            <SectionTitle eyebrow="Optional · select multiple" title="Packages (coffee & food)" />
            <div className="grid sm:grid-cols-2 gap-3">
              {packages.map(p => {
                const pick = picks.find(x => x.id === p.id);
                return (
                  <div key={p.id}
                    className={`p-5 border ${pick ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                    <button type="button" onClick={() => togglePick(p.id)} className="text-left w-full">
                      <div className="flex items-center justify-between">
                        <span className="chip">{p.kind === 'coffee' ? 'Coffee' : 'Food'}</span>
                        <span className="font-display text-lg">{fmt(p.pricePerPerson)} <span className="text-xs text-muted-foreground font-sans">/pp</span></span>
                      </div>
                      <div className="font-display text-xl mt-2">{p.name}</div>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                    </button>
                    {pick && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2">
                        <label className="text-xs">Persons
                          <input type="number" min={1} value={pick.persons}
                            onChange={e => updatePick(p.id, { persons: Math.max(1, +e.target.value) })}
                            className="ml-2 w-20 field" /></label>
                        <label className="text-xs">Time slot
                          <select value={pick.timeSlotId} onChange={e => updatePick(p.id, { timeSlotId: e.target.value })}
                            className="ml-2 field inline-block w-auto">
                            {p.timeSlots.map(t => <option key={t.id} value={t.id}>{t.label} · {t.time}</option>)}
                          </select>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })}
              {packages.length === 0 && <p className="text-muted-foreground col-span-2">No packages tied to this hotel yet.</p>}
            </div>
          </div>
        </div>

        {/* SIDEBAR — Seat arrangement library + summary */}
        <aside className="lg:col-span-4 space-y-6">
          {selectedHall && (
            <div className="border border-border bg-card p-6">
              <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-2">Seat arrangement</div>
              <h3 className="font-display text-2xl mb-4">Choose a layout</h3>
              <div className="space-y-2 max-h-72 overflow-auto pr-1">
                {arrangements.map(a => (
                  <button key={a.id} type="button" onClick={() => setSeatId(a.id)}
                    className={`w-full text-left grid grid-cols-[60px_1fr] gap-3 p-2 border ${seatId === a.id ? 'border-gold bg-secondary' : 'border-border hover:bg-secondary/50'}`}>
                    <img src={a.image} alt={a.name} className="w-full h-14 object-cover" />
                    <div>
                      <div className="font-display text-sm">{a.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-2">{a.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="lg:sticky lg:top-28 border border-border bg-card p-6">
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2">Reserve</div>
            <h3 className="font-display text-2xl mb-4">Three minutes, no account.</h3>

            <Field label="Email (returning customers auto-fill)" error={errors.email}>
              <input type="email" value={email} onBlur={onEmailBlur} onChange={e => setEmail(e.target.value)} className="field"/>
            </Field>
            <Field label="Full name" error={errors.name}><input value={name} onChange={e => setName(e.target.value)} className="field" /></Field>
            <Field label="Phone" error={errors.phone}><input value={phone} onChange={e => setPhone(e.target.value)} className="field" /></Field>
            <Field label="Date" error={errors.date}><input type="date" value={date} onChange={e => setDate(e.target.value)} className="field" /></Field>

            {/* Itemised summary */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Summary</div>
              {lines.length === 0 && <p className="text-xs text-muted-foreground">Nothing selected yet.</p>}
              <ul className="space-y-2 text-sm">
                {lines.map((l, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {l.kind === 'room' && `${l.nights}n · ${fmt(l.pricePerNight)}/n`}
                        {l.kind === 'hall' && `${l.days}d · ${fmt(l.pricePerDay)}/d${l.timeSlot ? ` · ${l.timeSlot}` : ''}${l.seatArrangement ? ` · ${l.seatArrangement}` : ''}`}
                        {l.kind === 'package' && `${l.persons} pax · ${fmt(l.pricePerPerson)}/pp${l.timeSlot ? ` · ${l.timeSlot}` : ''}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display">{fmt(l.subtotal)}</div>
                      <button onClick={() => removeLine(l)}
                        className="text-muted-foreground hover:text-destructive text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1">
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 space-y-1.5 text-sm border-t border-border pt-4">
              <Row k="Subtotal" v={fmt(total)} />
              <Row k="Deposit (50%)" v={fmt(deposit)} accent />
              <Row k="Balance later" v={fmt(total - deposit)} muted />
            </div>

            <button onClick={submit} disabled={paying || lines.length === 0}
              className="mt-5 w-full bg-gold text-gold-foreground py-4 text-xs uppercase tracking-[0.3em] hover:opacity-90 transition disabled:opacity-50">
              {paying ? 'Connecting to Flutterwave…' : `Pay ${fmt(deposit)} deposit`}
            </button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground text-center">
              Tracked by email · No sign-up
            </p>
          </div>
        </aside>
      </section>
    </SiteLayout>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-1">{eyebrow}</div>
      <h2 className="font-display text-3xl">{title}</h2>
    </div>
  );
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">{label}</span>
      {children}
      {error && <span className="text-destructive text-xs mt-1 block">{error}</span>}
    </label>
  );
}
function Row({ k, v, accent, muted }: { k: string; v: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? 'text-gold font-medium' : muted ? 'text-muted-foreground' : ''}`}>
      <span>{k}</span><span className="font-display">{v}</span>
    </div>
  );
}
