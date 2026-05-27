import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStoreBase } from "@/lib/store";
import { AdminPage } from "@/pages/admin/_shared";
import { useConfirm } from "@/components/ConfirmProvider";
import { toast } from "sonner";
import { deleteContact } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

export const Route = createFileRoute("/admin/contacts")({
  component: AdminContacts,
});

function AdminContacts() {
  const contacts = useStoreBase((s) => s.contacts);
  const set = useStoreBase((s) => s.set);
  const { confirm } = useConfirm();
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(contacts.length / PAGE_SIZE);
  const paginated = contacts.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDelete = async (id: string, name: string) => {
    if (await confirm({ title: `Delete message from ${name}?`, destructive: true, confirmText: "Delete" })) {
      set("contacts", contacts.filter((c) => c.id !== id));
      try {
        await deleteContact(id);
        toast.success("Contact deleted.");
      } catch (e: any) {
        toast.error(e?.message ?? "Delete failed");
      }
    }
  };

  return (
    <AdminPage title="Contacts" subtitle="Messages from the Contact Us form on the FAQs page.">
      <div className="border border-border divide-y divide-border bg-card">
        {contacts.length === 0 && (
          <p className="p-6 text-muted-foreground">No contact messages yet.</p>
        )}
        {paginated.map((c) => (
          <div key={c.id} className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-display text-lg">{c.name}</span>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {c.email}{c.phone && ` · ${c.phone}`}
                </div>
                <div className="font-medium mt-2">{c.subject}</div>
                <p className="text-sm mt-2 whitespace-pre-line text-foreground/80 max-w-2xl">{c.message}</p>
              </div>
              <button
                onClick={() => handleDelete(c.id, c.name)}
                className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-destructive transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · {contacts.length} total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs uppercase tracking-[0.2em] hover:bg-secondary transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
