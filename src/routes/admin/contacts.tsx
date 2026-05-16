import { createFileRoute } from "@tanstack/react-router";
import { useStoreBase } from "@/lib/store";
import { AdminPage } from "@/pages/admin/_shared";
import { useConfirm } from "@/components/ConfirmProvider";
import { toast } from "sonner";
import { deleteContact } from "@/lib/db";

export const Route = createFileRoute("/admin/contacts")({
  component: AdminContacts,
});

function AdminContacts() {
  const contacts = useStoreBase((s) => s.contacts);
  const set = useStoreBase((s) => s.set);
  const { confirm } = useConfirm();

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
        {contacts.map((c) => (
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
    </AdminPage>
  );
}
