import SiteLayout from "@/components/SiteLayout";
import { useStoreBase, makeReference, fmt } from "@/lib/store";
import { useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { reservationSchema } from "@/lib/validation";
import { useConfirm } from "@/components/ConfirmProvider";
import { X } from "lucide-react";
import type { BookingLine } from "@/lib/types";
import { useHotelParams } from "@/routes/hotels/$id";

type PkgPick = { id: string; persons: number; startTime: string; endTime: string };

export default function HotelDetail() {
  const { id } = useHotelParams();
  const hotels = useStoreBase((s) => s.hotels);
  const allRooms = useStoreBase((s) => s.rooms);
  const allHalls = useStoreBase((s) => s.halls);
  const allPackages = useStoreBase((s) => s.packages);
  const arrangements = useStoreBase((s) => s.arrangements);
  const bookings = useStoreBase((s) => s.bookings);
  const addBooking = useStoreBase((s) => s.addBooking);
  const nav = useNavigate();
  const { alert: alertDialog } = useConfirm();

  const hotel = hotels.find((h) => h.id === id);
  const rooms = allRooms.filter((r) => r.hotelId === id);
  const halls = allHalls.filter((h) => h.hotelId === id);
  const packages = allPackages.filter((p) => p.hotelId === id);

  // Selections — all optional, now arrays for multiple selections
  type RoomSelection = { roomId: string; rooms: number; nights: number };
  type HallSelection = { hallId: string; days: number; startTime: string; endTime: string; seatArrangementId: string };

  const [selectedRooms, setSelectedRooms] = useState<RoomSelection[]>([]);
  const [selectedHalls, setSelectedHalls] = useState<HallSelection[]>([]);

  const [picks, setPicks] = useState<PkgPick[]>([]);

  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  // Autofill on returning email
  const onEmailBlur = () => {
    if (!email.trim()) return;
    const prior = bookings.find(
      (b) => b.customer.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (prior) {
      if (!name) setName(prior.customer.name);
      if (!phone) setPhone(prior.customer.phone);
      toast.success("Welcome back — details prefilled.");
    }
  };

  const lines = useMemo<BookingLine[]>(() => {
    const out: BookingLine[] = [];
    // Rooms - support multiple
    selectedRooms.forEach((sel) => {
      const room = rooms.find((r) => r.id === sel.roomId);
      if (room) {
        out.push({
          kind: "room",
          name: room.type,
          rooms: sel.rooms,
          nights: sel.nights,
          pricePerNight: room.price,
          subtotal: room.price * sel.rooms * sel.nights,
        });
      }
    });
    // Halls - support multiple
    selectedHalls.forEach((sel) => {
      const hall = halls.find((h) => h.id === sel.hallId);
      if (hall) {
        const seat = arrangements.find((a) => a.id === sel.seatArrangementId);
        out.push({
          kind: "hall",
          name: hall.name,
          days: sel.days,
          startTime: sel.startTime,
          endTime: sel.endTime,
          pricePerDay: hall.pricePerDay,
          timeSlot: `${sel.startTime}–${sel.endTime}`,
          seatArrangement: seat?.name,
          subtotal: hall.pricePerDay * sel.days,
        });
      }
    });
    picks.forEach((pk) => {
      const p = packages.find((x) => x.id === pk.id);
      if (!p) return;
      out.push({
        kind: "package",
        name: p.name,
        persons: pk.persons,
        pricePerPerson: p.pricePerPerson,
        timeSlot: `${pk.startTime}–${pk.endTime}`,
        subtotal: p.pricePerPerson * pk.persons,
      });
    });
    return out;
  }, [
    selectedRooms,
    selectedHalls,
    picks,
    rooms,
    halls,
    packages,
    arrangements,
  ]);

  const total = lines.reduce((a, l) => a + l.subtotal, 0);
  const deposit = Math.round(total * 0.5);

  if (!hotel) {
    return (
      <SiteLayout>
        <div className="pt-40 mx-auto max-w-[1400px] px-6 lg:px-10">
          <p>
            Hotel not found.{" "}
            <Link to="/hotels" className="underline">
              Back
            </Link>
          </p>
        </div>
      </SiteLayout>
    );
  }

  const removeLine = (l: BookingLine) => {
    if (l.kind === "room") {
      setSelectedRooms((prev) => prev.filter((r) => r.roomId !== (rooms.find((rm) => rm.type === l.name)?.id ?? "")));
    } else if (l.kind === "hall") {
      setSelectedHalls((prev) => prev.filter((h) => h.hallId !== (halls.find((hl) => hl.name === l.name)?.id ?? "")));
    } else if (l.kind === "package") {
      const p = packages.find((x) => x.name === l.name);
      if (p) setPicks((prev) => prev.filter((x) => x.id !== p.id));
    }
  };

  const togglePick = (pkgId: string) => {
    setPicks((p) =>
      p.some((x) => x.id === pkgId)
        ? p.filter((x) => x.id !== pkgId)
        : [
            ...p,
            {
              id: pkgId,
              persons: 20,
              startTime: "12:00",
              endTime: "14:00",
            },
          ],
    );
  };
  const updatePick = (pkgId: string, patch: Partial<PkgPick>) =>
    setPicks((p) => p.map((x) => (x.id === pkgId ? { ...x, ...patch } : x)));

const submit = async () => {
    if (lines.length === 0) {
      toast.error("Add at least a room, a hall or a package.");
      return;
    }
    const res = reservationSchema.safeParse({ name, email, phone, date });
    if (!res.success) {
      const map: Record<string, string> = {};
      res.error.issues.forEach((i) => {
        map[i.path.join(".")] = i.message;
      });
      setErrors(map);
      return;
    }
    setErrors({});
    setPaying(true);
    
    // Generate reference for this booking attempt
    const ref = makeReference();
    
    // Create booking with pending payment status first
    addBooking({
      reference: ref,
      createdAt: new Date().toISOString(),
      type: "reservation",
      customer: { name, email, phone },
      details: { hotel: hotel.name, date },
      lines,
      total,
      amountPaid: 0,
      balanceDue: total,
      paymentStatus: "unpaid",
      fulfillment: "pending",
    });
    
    // Initialize Paystack payment
    await new Promise<void>((resolve, reject) => {
      // @ts-ignore - Paystack will be available via window object
      if (window.PaystackPop) {
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC, // Public key
          email: email,
          amount: Math.round(deposit) * 100, // Amount in kobo (NGN)
          ref: ref, // Use the reference we just created
          metadata: {
            custom_fields: [
              {
                display_name: "Name",
                variable_name: "name",
                value: name
              },
              {
                display_name: "Phone",
                variable_name: "phone",
                value: phone
              },
              {
                display_name: "Hotel",
                variable_name: "hotel",
                value: hotel?.name ?? ''
              },
              {
                display_name: "Date",
                variable_name: "date",
                value: date
              }
            ]
          },
          onClose: () => {
            setPaying(false);
            // Update booking status to failed if payment cancelled
            // In a real app, you might want to delete the pending booking or mark it failed
            reject(new Error('Payment cancelled'));
          },
          callback: (response: any) => {
            // Payment successful - the webhook will handle updating the booking
            resolve(response);
          }
        });
        
        // Open the Paystack payment modal
        handler.openIframe();
      } else {
        // Fallback: Load Paystack script then initialize
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.onload = () => {
          // @ts-ignore - Paystack will be available after script loads
          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC,
            email: email,
            amount: Math.round(deposit) * 100,
            ref: ref,
            metadata: {
              custom_fields: [
                {
                  display_name: "Name",
                  variable_name: "name",
                  value: name
                },
                {
                  display_name: "Phone",
                  variable_name: "phone",
                  value: phone
                },
                {
                  display_name: "Hotel",
                  variable_name: "hotel",
                  value: hotel?.name ?? ''
                },
                {
                  display_name: "Date",
                  variable_name: "date",
                  value: date
                }
              ]
            },
            onClose: () => {
              setPaying(false);
              // Update booking status to failed if payment cancelled
              reject(new Error('Payment cancelled'));
            },
            callback: (response: any) => {
              resolve(response);
            }
          });
          
          handler.openIframe();
        };
        script.onerror = () => {
          setPaying(false);
          reject(new Error('Failed to load Paystack script'));
        };
        document.body.appendChild(script);
      }
    }).then(async (response: any) => {
      // Payment was successful - the webhook will update the booking status
      // Show success message and redirect to tracking
      setPaying(false);
      
      await alertDialog({
        title: "Payment successful",
        description: `Reference ${ref}. Your payment was successful! We're confirming your booking...`,
        confirmText: "View booking",
      });
      toast.success("Payment successful!");
      nav(`/track?ref=${ref}`);
    }).catch((error: any) => {
      // Payment failed or cancelled
      setPaying(false);
      if (error.message !== 'Payment cancelled') {
        toast.error(`Payment failed: ${error.message}`);
      }
      // Update booking status to failed
      // In a production app, you might want to delete this or mark it clearly as failed
    });
  };

  return (
    <SiteLayout>
      <section className="pt-28">
        <div className="relative h-[60vh] bg-ink">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover opacity-60"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 mx-auto max-w-[1400px] px-6 lg:px-10 pb-12 text-ink-foreground">
            <div className="text-[10px] uppercase tracking-[0.4em] text-gold">
              {hotel.location}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl mt-3">
              {hotel.name}
            </h1>
            <p className="mt-3 opacity-80 max-w-xl">{hotel.tagline}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 py-16 grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-14">
          {/* ROOMS - multiple selection */}
          <div>
            <SectionTitle eyebrow="Optional · select multiple" title="Rooms" />
            <div className="space-y-3 overflow-hidden">
              {rooms.map((r) => {
                const sel = selectedRooms.find((sr) => sr.roomId === r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex flex-col sm:grid sm:grid-cols-[120px_1fr_auto] gap-4 sm:gap-6 p-4 border ${sel ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          setSelectedRooms((prev) => prev.filter((sr) => sr.roomId !== r.id));
                        } else {
                          setSelectedRooms((prev) => [...prev, { roomId: r.id, rooms: 1, nights: 1 }]);
                        }
                      }}
                      className="flex flex-col sm:contents text-left gap-2 sm:gap-4"
                    >
                      <img
                        src={r.image}
                        alt={r.type}
                        className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-md"
                        width={120}
                        height={96}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-xl sm:text-2xl">
                          {r.type}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {r.description}
                        </p>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                          Sleeps {r.capacity}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center justify-between sm:block sm:text-right mt-3 sm:mt-0">
                      <div className="font-display text-xl sm:text-2xl text-right">
                        {fmt(r.price)}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        /night
                      </div>
                    </div>
                    {sel && (
                      <div className="col-span-full flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
                        <label className="text-xs">
                          Rooms
                          <input
                            type="number"
                            min={1}
                            value={sel.rooms}
                            onChange={(e) =>
                              setSelectedRooms((prev) =>
                                prev.map((sr) =>
                                  sr.roomId === r.id
                                    ? { ...sr, rooms: Math.max(1, +e.target.value) }
                                    : sr
                                )
                              )
                            }
                            className="ml-2 w-16 field"
                          />
                        </label>
                        <label className="text-xs">
                          Nights
                          <input
                            type="number"
                            min={1}
                            value={sel.nights}
                            onChange={(e) =>
                              setSelectedRooms((prev) =>
                                prev.map((sr) =>
                                  sr.roomId === r.id
                                    ? { ...sr, nights: Math.max(1, +e.target.value) }
                                    : sr
                                )
                              )
                            }
                            className="ml-2 w-16 field"
                          />
                        </label>
                        <span className="text-sm text-muted-foreground sm:ml-auto">
                          Subtotal {fmt(r.price * sel.rooms * sel.nights)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
              {rooms.length === 0 && (
                <p className="text-muted-foreground">No rooms listed yet.</p>
              )}
            </div>
          </div>

          {/* HALLS - multiple selection */}
          <div>
            <SectionTitle eyebrow="Optional · select multiple" title="Event halls" />
            <div className="space-y-3 overflow-hidden">
              {halls.map((h) => {
                const sel = selectedHalls.find((sh) => sh.hallId === h.id);
                return (
                  <div
                    key={h.id}
                    className={`flex flex-col sm:grid sm:grid-cols-[120px_1fr_auto] gap-4 sm:gap-6 p-4 border ${sel ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"}`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (sel) {
                          setSelectedHalls((prev) => prev.filter((sh) => sh.hallId !== h.id));
                        } else {
                          setSelectedHalls((prev) => [
                            ...prev,
                            { hallId: h.id, days: 1, startTime: "10:00", endTime: "18:00", seatArrangementId: arrangements[0]?.id ?? "" },
                          ]);
                        }
                      }}
                      className="flex flex-col sm:contents text-left gap-2 sm:gap-4"
                    >
                      <img
                        src={h.image}
                        alt={h.name}
                        className="w-full sm:w-32 h-32 sm:h-24 object-cover rounded-md"
                        width={120}
                        height={96}
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-display text-xl sm:text-2xl">
                          {h.name}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-2">
                          Capacity {h.capacity}
                        </div>
                        {h.amenities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {h.amenities.map((a) => (
                              <span key={a} className="chip">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center justify-between sm:block sm:text-right mt-3 sm:mt-0">
                      <div className="font-display text-xl sm:text-2xl text-right">
                        {fmt(h.pricePerDay)}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        /day (8h)
                      </div>
                    </div>
                    {sel && (
                      <>
                      <div className="col-span-full grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
                        <label className="text-xs">
                          Days
                          <input
                            type="number"
                            min={1}
                            value={sel.days}
                            onChange={(e) =>
                              setSelectedHalls((prev) =>
                                prev.map((sh) =>
                                  sh.hallId === h.id
                                    ? { ...sh, days: Math.max(1, +e.target.value) }
                                    : sh
                                )
                              )
                            }
                            className="ml-2 w-16 field"
                          />
                        </label>
                        <label className="text-xs">
                          Start
                          <input
                            type="time"
                            value={sel.startTime}
                            onChange={(e) =>
                              setSelectedHalls((prev) =>
                                prev.map((sh) =>
                                  sh.hallId === h.id
                                    ? { ...sh, startTime: e.target.value }
                                    : sh
                                )
                              )
                            }
                            className="ml-2 w-24 field"
                          />
                        </label>
                        <label className="text-xs">
                          End
                          <input
                            type="time"
                            value={sel.endTime}
                            onChange={(e) =>
                              setSelectedHalls((prev) =>
                                prev.map((sh) =>
                                  sh.hallId === h.id
                                    ? { ...sh, endTime: e.target.value }
                                    : sh
                                )
                              )
                            }
                            className="ml-2 w-24 field"
                          />
                        </label>
                        <span className="text-xs text-muted-foreground flex items-center">
                           Subtotal {fmt(h.pricePerDay * sel.days)}
                        </span>
                      </div>
                      <div className="col-span-full mt-3 pt-3 border-t border-border">
                        <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Seat arrangement</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {arrangements.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() =>
                                setSelectedHalls((prev) =>
                                  prev.map((sh) =>
                                    sh.hallId === h.id ? { ...sh, seatArrangementId: a.id } : sh
                                  )
                                )
                              }
                              className={`text-left p-2 border ${sel.seatArrangementId === a.id ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"}`}
                            >
                              <img src={a.image} alt={a.name} className="w-full h-14 object-cover mb-1" />
                              <div className="font-display text-xs">{a.name}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      </>
                    )}
                  </div>
                );
              })}
              {halls.length === 0 && (
                <p className="text-muted-foreground">No halls listed yet.</p>
              )}
            </div>
          </div>

          {/* ADD-ONS - only show if hotel has halls */}
          {halls.length > 0 && packages.length > 0 && (
            <div>
              <SectionTitle
                eyebrow="Optional · select multiple"
                title="Add-ons (coffee & food)"
              />
              <div className="grid sm:grid-cols-2 gap-3">
                {packages.map((p) => {
                  const pick = picks.find((x) => x.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-5 border ${pick ? "border-gold bg-secondary" : "border-border hover:bg-secondary/50"}`}
                    >
                      <button
                        type="button"
                        onClick={() => togglePick(p.id)}
                        className="text-left w-full"
                      >
                        <div className="flex items-center justify-between">
                          <span className="chip">
                            {p.kind === "coffee" ? "Coffee" : "Food"}
                          </span>
                          <span className="font-display text-lg">
                            {fmt(p.pricePerPerson)}{" "}
                            <span className="text-xs text-muted-foreground font-sans">
                              /pp
                            </span>
                          </span>
                        </div>
                        <div className="font-display text-xl mt-2">
                          {p.name}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {p.description}
                        </p>
                      </button>
                      {pick && (
                        <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2">
                          <label className="text-xs">
                            Persons
                            <input
                              type="number"
                              min={1}
                              value={pick.persons}
                              onChange={(e) =>
                                updatePick(p.id, {
                                  persons: Math.max(1, +e.target.value),
                                })
                              }
                              className="ml-2 w-16 field"
                            />
                          </label>
                          <label className="text-xs">
                            Start
                            <input
                              type="time"
                              value={pick.startTime}
                              onChange={(e) =>
                                updatePick(p.id, { startTime: e.target.value })
                              }
                              className="ml-2 w-20 field"
                            />
                          </label>
                          <label className="text-xs">
                            End
                            <input
                              type="time"
                              value={pick.endTime}
                              onChange={(e) =>
                                updatePick(p.id, { endTime: e.target.value })
                              }
                              className="ml-2 w-20 field"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SIDEBAR — summary */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="lg:sticky lg:top-28 border border-border bg-card p-6">
            <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2">
              Reserve
            </div>
            <h3 className="font-display text-2xl mb-4">
              Three minutes, no account.
            </h3>

            <Field
              label="Email (returning customers auto-fill)"
              error={errors.email}
            >
              <input
                type="email"
                value={email}
                onBlur={onEmailBlur}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Full name" error={errors.name}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field"
              />
            </Field>
            <Field label="Date" error={errors.date}>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="field"
              />
            </Field>

            {/* Itemised summary */}
            <div className="mt-4 border-t border-border pt-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
                Summary
              </div>
              {lines.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nothing selected yet.
                </p>
              )}
              <ul className="space-y-2 text-sm">
                {lines.map((l, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {l.kind === "room" &&
                          `${l.nights}n · ${fmt(l.pricePerNight)}/n`}
                        {l.kind === "hall" &&
                          `${l.days}d · ${fmt(l.pricePerDay)}/d${l.timeSlot ? ` · ${l.timeSlot}` : ""}${l.seatArrangement ? ` · ${l.seatArrangement}` : ""}`}
                        {l.kind === "package" &&
                          `${l.persons} pax · ${fmt(l.pricePerPerson)}/pp${l.timeSlot ? ` · ${l.timeSlot}` : ""}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display">{fmt(l.subtotal)}</div>
                      <button
                        onClick={() => removeLine(l)}
                        className="text-muted-foreground hover:text-destructive text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1"
                      >
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

            <button
              onClick={submit}
              disabled={paying || lines.length === 0}
              className="mt-5 w-full bg-gold text-gold-foreground py-4 text-xs uppercase tracking-[0.3em] hover:opacity-90 transition disabled:opacity-50"
            >
{paying
                 ? "Connecting to Paystack…"
                 : `Pay ${fmt(deposit)} deposit`}
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
      <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-1">
        {eyebrow}
      </div>
      <h2 className="font-display text-3xl">{title}</h2>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-3">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
        {label}
      </span>
      {children}
      {error && (
        <span className="text-destructive text-xs mt-1 block">{error}</span>
      )}
    </label>
  );
}
function Row({
  k,
  v,
  accent,
  muted,
}: {
  k: string;
  v: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${accent ? "text-gold font-medium" : muted ? "text-muted-foreground" : ""}`}
    >
      <span>{k}</span>
      <span className="font-display">{v}</span>
    </div>
  );
}
