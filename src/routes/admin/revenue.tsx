import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStoreBase, fmt } from "@/lib/store";
import { AdminPage } from "@/pages/admin/_shared";
import type { Booking } from "@/lib/types";

export const Route = createFileRoute("/admin/revenue")({
  component: AdminRevenue,
});

function AdminRevenue() {
  const bookings = useStoreBase((s) => s.bookings);
  const [selected, setSelected] = useState<Booking | null>(null);

  const stats = useMemo(() => {
    const total = bookings.reduce((a, b) => a + b.total, 0);
    const paid = bookings.reduce((a, b) => a + b.amountPaid, 0);
    const outstanding = bookings.reduce((a, b) => a + b.balanceDue, 0);
    const reservations = bookings.filter((b) => b.type === "reservation");
    const rentals = bookings.filter((b) => b.type === "rental");
    const resTotal = reservations.reduce((a, b) => a + b.total, 0);
    const rentTotal = rentals.reduce((a, b) => a + b.total, 0);

    // Last 30 days, grouped by day
    const days: { day: string; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const value = bookings
        .filter((b) => b.createdAt.slice(0, 10) === key)
        .reduce((a, b) => a + b.total, 0);
      days.push({ day: key, value });
    }
    const max = Math.max(1, ...days.map((d) => d.value));

    return {
      total,
      paid,
      outstanding,
      resTotal,
      rentTotal,
      days,
      max,
      count: bookings.length,
    };
  }, [bookings]);

  return (
    <AdminPage
      title="Revenue"
      subtitle="Bookings, payments and the last 30 days at a glance."
    >
      <div className="grid md:grid-cols-4 gap-px bg-border border border-border mb-10 mx-auto">
        <Stat label="Gross" value={fmt(stats.total)} />
        <Stat label="Collected" value={fmt(stats.paid)} accent />
        <Stat label="Outstanding" value={fmt(stats.outstanding)} />
        <Stat label="Bookings" value={String(stats.count)} />
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-border border border-border mb-10">
        <Stat label="Reservations revenue" value={fmt(stats.resTotal)} />
        <Stat label="Rentals revenue" value={fmt(stats.rentTotal)} />
      </div>

      <div className="border border-border bg-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Last 30 days</h2>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            By booking date
          </span>
        </div>
        <div className="flex items-end gap-1 h-40">
          {stats.days.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${fmt(d.value)}`}
              className="flex-1 bg-gold/30 hover:bg-gold transition"
              style={{ height: `${(d.value / stats.max) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{stats.days[0].day}</span>
          <span>{stats.days[stats.days.length - 1].day}</span>
        </div>
      </div>

      <div className="mt-10 border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-2xl">Latest bookings</h2>
        </div>
        <div className="divide-y divide-border">
          {bookings
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 5)
            .map((b) => (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-secondary transition text-left"
              >
                <div>
                  <div className="text-sm font-medium">{b.customer.name}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">
                    {b.type} · {b.createdAt.slice(0, 10)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg">{fmt(b.total)}</div>
                  <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {b.amountPaid > 0 ? `${fmt(b.amountPaid)} paid` : "Unpaid"}
                  </div>
                </div>
              </button>
            ))}
        </div>
      </div>
      {selected && (
        <BookingModal booking={selected} onClose={() => setSelected(null)} />
      )}
    </AdminPage>
  );
}

function BookingModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-4 sm:p-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl sm:text-3xl">Booking details</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Reference</div>
            <div className="font-medium">{booking.reference}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Date</div>
            <div className="font-medium">{booking.createdAt.slice(0, 10)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Customer</div>
            <div className="font-medium">{booking.customer.name}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Email</div>
            <div className="font-medium">{booking.customer.email}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Phone</div>
            <div className="font-medium">{booking.customer.phone}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Type</div>
            <div className="font-medium capitalize">{booking.type}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Payment</div>
            <div className="font-medium capitalize">{booking.paymentStatus}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Fulfillment</div>
            <div className="font-medium capitalize">{booking.fulfillment}</div>
          </div>
        </div>

        {booking.lines && booking.lines.length > 0 && (
          <div className="mb-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Items</div>
            <div className="divide-y divide-border border border-border">
              {booking.lines.map((line, i) => (
                <div key={i} className="px-4 py-3 flex justify-between">
                  <div>
                    <div className="text-sm font-medium capitalize">{line.kind}</div>
                    <div className="text-xs text-muted-foreground">{line.name}</div>
                    {line.kind === 'room' && <div className="text-xs text-muted-foreground">{line.nights} nights · {line.rooms} rooms</div>}
                    {line.kind === 'hall' && <div className="text-xs text-muted-foreground">{line.days} days · {line.startTime}–{line.endTime}</div>}
                    {line.kind === 'package' && <div className="text-xs text-muted-foreground">{line.persons} persons</div>}
                    {line.kind === 'rental' && <div className="text-xs text-muted-foreground">{line.quantity} units · {line.days} days</div>}
                  </div>
                  <div className="font-display text-lg">{fmt(line.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Total</div>
            <div className="font-display text-2xl">{fmt(booking.total)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Paid</div>
            <div className="font-display text-2xl text-gold">{fmt(booking.amountPaid)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-1">Balance</div>
            <div className="font-display text-2xl">{fmt(booking.balanceDue)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-card p-6">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display text-3xl mt-2 ${accent ? "text-gold" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
