import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { loadActivity } from '@/lib/db';
import type { ActivityLog } from '@/lib/types';
import { History, User, Clock, Info } from 'lucide-react';
import { format } from 'date-fns';

export const Route = createFileRoute('/admin/activity')({
  component: ActivityPage,
});

function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivity()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent animate-spin rounded-full mb-4" />
        <p className="text-muted-foreground text-xs uppercase tracking-widest">Loading activity logs…</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-4xl mb-2">Activity Log</h1>
        <p className="text-muted-foreground">Monitor administrative actions and system changes.</p>
      </div>

      <div className="bg-card border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Admin</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Action</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Details</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                    No activity recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{log.userName}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{log.userId.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold/10 text-gold border border-gold/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="text-sm text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                        {typeof log.details === 'string' 
                          ? log.details 
                          : (log.details ? JSON.stringify(log.details) : '—')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="text-sm">{format(new Date(log.at), 'MMM d, HH:mm')}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                        {format(new Date(log.at), 'yyyy')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
