import { useStoreBase, fmt } from '@/lib/store';
import { AdminPage } from './_shared';
import { useMemo } from 'react';

export default function AdminRevenue() {
  const bookings = useStoreBase(s => s.bookings);

  const stats = useMemo(() => {
    const total = bookings.reduce((a, b) => a + b.total, 0);
    const paid = bookings.reduce((a, b) => a + b.amountPaid, 0);
    const outstanding = bookings.reduce((a, b) => a + b.balanceDue, 0);
    const reservations = bookings.filter(b => b.type === 'reservation');
    const rentals = bookings.filter(b => b.type === 'rental');
    const resTotal = reservations.reduce((a, b) => a + b.total, 0);
    const rentTotal = rentals.reduce((a, b) => a + b.total, 0);

    // Last 30 days, grouped by day
    const days: { day: string; value: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const value = bookings
        .filter(b => b.createdAt.slice(0, 10) === key)
        .reduce((a, b) => a + b.total, 0);
      days.push({ day: key, value });
    }
    const max = Math.max(1, ...days.map(d => d.value));

    return { total, paid, outstanding, resTotal, rentTotal, days, max, count: bookings.length };
  }, [bookings]);

  return (
    <AdminPage title="Revenue" subtitle="Bookings, payments and the last 30 days at a glance.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border mb-6 lg:mb-10 w-full max-w-full">
        <Stat label="Gross" value={fmt(stats.total)} />
        <Stat label="Collected" value={fmt(stats.paid)} accent />
        <Stat label="Outstanding" value={fmt(stats.outstanding)} />
        <Stat label="Bookings" value={String(stats.count)} />
      </div>

      <div className="grid grid-cols-2 gap-px bg-border border border-border mb-6 lg:mb-10 w-full max-w-full">
        <Stat label="Reservations" value={fmt(stats.resTotal)} />
        <Stat label="Rentals" value={fmt(stats.rentTotal)} />
      </div>

      <div className="border border-border bg-card p-3 sm:p-4 lg:p-6">
        <div className="flex items-baseline justify-between mb-3 lg:mb-4 gap-2 flex-wrap">
          <h2 className="font-display text-lg sm:text-xl lg:text-2xl">Last 30 days</h2>
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">By booking date</span>
        </div>
        <div className="flex items-end gap-px sm:gap-1 h-24 sm:h-32 lg:h-40">
          {stats.days.map(d => (
            <div key={d.day} title={`${d.day}: ${fmt(d.value)}`} className="flex-1 bg-gold/30 hover:bg-gold transition" style={{ height: `${(d.value / stats.max) * 100}%` }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>{stats.days[0].day}</span>
          <span>{stats.days[stats.days.length - 1].day}</span>
        </div>
      </div>
    </AdminPage>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card p-3 sm:p-4 lg:p-6 text-center sm:text-left">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className={`font-display text-lg sm:text-xl lg:text-3xl mt-1 lg:mt-2 ${accent ? 'text-gold' : ''}`}>{value}</div>
    </div>
  );
}
