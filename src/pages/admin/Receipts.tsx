import { useState, useRef, useEffect } from "react";
import { AdminPage, inputCls, PrimaryBtn, GhostBtn } from "./_shared";
import { useStoreBase } from "@/lib/store";
import { toast } from "sonner";
import type { SavedReceipt } from "@/lib/types";
import { Trash2, FileText, Mail, Download, Send } from "lucide-react";
import { loadReceipts, insertReceipt, deleteReceipt as deleteReceiptDb } from "@/lib/db";

type DocType = "receipt" | "quote" | "invoice";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function AdminReceipts() {
  const branding = useStoreBase(s => s.branding);
  const [receipts, setReceipts] = useState<SavedReceipt[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReceipts().then(setReceipts);
  }, []);

  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = !search || r.clientName.toLowerCase().includes(search.toLowerCase()) || r.clientEmail?.toLowerCase().includes(search.toLowerCase());
    const receiptDate = new Date(r.createdAt);
    const matchesFrom = !dateFrom || receiptDate >= new Date(dateFrom);
    const matchesTo = !dateTo || receiptDate <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesFrom && matchesTo;
  });
  
  const [docType, setDocType] = useState<DocType>("invoice");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const saveReceipt = async () => {
    if (!clientName) {
      toast.error("Please enter a client name");
      return;
    }
    const receipt: SavedReceipt = {
      id: crypto.randomUUID(),
      docType,
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      items: items.map(({ description, quantity, unitPrice }) => ({ description, quantity, unitPrice })),
      notes,
      total: subtotal,
      createdAt: new Date().toISOString(),
    };
    await insertReceipt(receipt);
    setReceipts([receipt, ...receipts]);
    toast.success("Receipt saved");
  };

  const loadReceipt = (r: SavedReceipt) => {
    setDocType(r.docType);
    setClientName(r.clientName);
    setClientEmail(r.clientEmail);
    setClientPhone(r.clientPhone);
    setClientAddress(r.clientAddress);
    setNotes(r.notes);
    setItems(r.items.length > 0 ? r.items.map((item, i) => ({ ...item, id: String(i + 1) })) : [{ id: "1", description: "", quantity: 1, unitPrice: 0 }]);
    toast.success("Receipt loaded");
  };

  const generatePDF = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.description || '—'}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₦${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docType.charAt(0).toUpperCase() + docType.slice(1)} - ${clientName || "Document"}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; }
            .brand { font-size: 24px; font-weight: bold; }
            .doc-title { font-size: 32px; text-transform: uppercase; letter-spacing: 4px; }
            .meta { text-align: right; font-size: 12px; }
            .client-info { margin-bottom: 30px; }
            .client-info h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #666; }
            .client-info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #1a1a1a; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .totals-row.total { border-bottom: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; margin-top: 10px; }
            .notes { margin-top: 40px; padding: 20px; background: #f9f9f9; }
            .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="/logo.png" alt="${branding.brandName}" style="height: 48px; width: auto; object-contain;" />
              <span style="font-size: 24px; font-weight: bold;">${branding.brandName}</span>
            </div>
            <div style="font-size: 24px; text-transform: uppercase; letter-spacing: 4px;">${docType}</div>
          </div>
          <div style="text-align: right; font-size: 12px; margin-bottom: 30px;">
            <div>${docNumber}</div>
            <div style="color: #666;">${today}</div>
          </div>
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #666;">Bill To</h3>
            <p style="font-weight: bold; margin: 4px 0;">${clientName || 'Client Name'}</p>
            <p style="margin: 4px 0; color: #666;">${clientEmail}</p>
            <p style="margin: 4px 0; color: #666;">${clientPhone}</p>
            <p style="margin: 4px 0; color: #666;">${clientAddress}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #1a1a1a;">
                <th style="text-align: left; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Description</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Qty</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Price</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-left: auto; width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666;">Subtotal</span>
              <span>₦${subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; margin-top: 10px;">
              <span>Total</span>
              <span>₦${subtotal.toLocaleString()}</span>
            </div>
          </div>
          ${notes ? `
          <div style="margin-top: 40px; padding: 20px; background: #f9f9f9;">
            <h4 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Notes</h4>
            <p>${notes}</p>
          </div>
          ` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const sendEmail = async () => {
    if (!clientEmail) {
      toast.error("Please enter client email address");
      return;
    }
    if (!clientName) {
      toast.error("Please enter client name");
      return;
    }

    toast.success(`Preparing ${docType}...`);

    const printContent = printRef.current;
    if (!printContent) {
      toast.error('No preview available');
      return;
    }

    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${item.description || '—'}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₦${item.unitPrice.toLocaleString()}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">₦${(item.quantity * item.unitPrice).toLocaleString()}</td>
      </tr>
    `).join('');

    const docNumber = `DOC-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docType.charAt(0).toUpperCase() + docType.slice(1)} - ${clientName}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Georgia, serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; }
            .brand { font-size: 24px; font-weight: bold; }
            .doc-title { font-size: 32px; text-transform: uppercase; letter-spacing: 4px; }
            .meta { text-align: right; font-size: 12px; }
            .client-info { margin-bottom: 30px; }
            .client-info h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #666; }
            .client-info p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #1a1a1a; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; }
            .totals { margin-left: auto; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .totals-row.total { border-bottom: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; margin-top: 10px; }
            .notes { margin-top: 40px; padding: 20px; background: #f9f9f9; }
            .notes h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="/logo.png" alt="${branding.brandName}" style="height: 48px; width: auto; object-contain;" />
              <span style="font-size: 24px; font-weight: bold;">${branding.brandName}</span>
            </div>
            <div style="font-size: 24px; text-transform: uppercase; letter-spacing: 4px;">${docType}</div>
          </div>
          <div style="text-align: right; font-size: 12px; margin-bottom: 30px;">
            <div>${docNumber}</div>
            <div style="color: #666;">${today}</div>
          </div>
          <div style="margin-bottom: 30px;">
            <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; color: #666;">Bill To</h3>
            <p style="font-weight: bold; margin: 4px 0;">${clientName}</p>
            <p style="margin: 4px 0; color: #666;">${clientEmail}</p>
            <p style="margin: 4px 0; color: #666;">${clientPhone}</p>
            <p style="margin: 4px 0; color: #666;">${clientAddress}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="border-bottom: 2px solid #1a1a1a;">
                <th style="text-align: left; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Description</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Qty</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Price</th>
                <th style="text-align: right; padding: 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div style="margin-left: auto; width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
              <span style="color: #666;">Subtotal</span>
              <span>₦${subtotal.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 2px solid #1a1a1a; font-weight: bold; font-size: 18px; margin-top: 10px;">
              <span>Total</span>
              <span>₦${subtotal.toLocaleString()}</span>
            </div>
          </div>
          ${notes ? `
          <div class="notes">
            <h4>Notes / Terms</h4>
            <p>${notes}</p>
          </div>` : ''}
        </body>
      </html>
    `;

    toast.success(`Sending ${docType} to ${clientEmail}...`);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientEmail,
          subject: `${docType.charAt(0).toUpperCase() + docType.slice(1)} - ${docNumber} from ${branding.brandName}`,
          html,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(`${docType.charAt(0).toUpperCase() + docType.slice(1)} sent to ${clientEmail}`);
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (err) {
      toast.error('Failed to send email');
    }
  };

  const docNumber = `DOC-${Date.now().toString(36).toUpperCase()}`;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <AdminPage 
      title="Receipts" 
      subtitle="Create receipts, quotes, or invoices"
      action={
        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={generatePDF} 
            disabled={!clientName}
            className="inline-flex items-center justify-center gap-2 bg-transparent border border-border px-4 py-2 text-xs uppercase tracking-[0.25em] hover:bg-secondary transition disabled:opacity-50 flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          <button 
            onClick={sendEmail} 
            disabled={!clientName || !clientEmail}
            className="inline-flex items-center justify-center gap-2 bg-ink text-bone px-5 py-2 text-xs uppercase tracking-[0.25em] hover:bg-ink/90 transition disabled:opacity-50 flex-1 sm:flex-initial"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      }
    >
      {receipts.length > 0 && (
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1">
              <input 
                className={inputCls} 
                placeholder="Search by name or email..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <input 
                className={inputCls} 
                type="date" 
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                title="From date"
              />
              <input 
                className={inputCls} 
                type="date" 
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                title="To date"
              />
            </div>
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Saved Receipts ({filteredReceipts.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredReceipts.map(r => (
              <div key={r.id} className="border border-border p-3 lg:p-4 bg-card hover:border-gold/50 transition cursor-pointer group" onClick={() => loadReceipt(r)}>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-gold">{r.docType}</span>
                  <span className="text-xs text-muted-foreground">₦{r.total.toLocaleString()}</span>
                </div>
                <div className="font-medium text-sm truncate">{r.clientName}</div>
                <div className="text-xs text-muted-foreground truncate">{r.clientEmail || 'No email'}</div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      await deleteReceiptDb(r.id);
                      setReceipts(receipts.filter(x => x.id !== r.id));
                      toast.success('Receipt deleted'); 
                    }}
                    className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-5 lg:space-y-6">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-2 items-start lg:items-center">
            <div className="flex-1">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">Document Type</span>
              <div className="flex flex-wrap gap-2">
                {(["receipt", "quote", "invoice"] as DocType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setDocType(type)}
                    className={`px-3 lg:px-4 py-2 text-xs uppercase tracking-[0.25em] border transition ${
                      docType === type 
                        ? "bg-ink text-bone border-ink" 
                        : "border-border hover:border-ink"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Client Name</span>
              <input className={inputCls} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John Doe" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Email</span>
              <input className={inputCls} type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="john@example.com" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Phone</span>
              <input className={inputCls} value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+234 800 000 0000" />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Address</span>
              <input className={inputCls} value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="123 Main St, Lagos" />
            </label>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">Items</span>
            <div className="space-y-3 lg:space-y-0">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col lg:flex-row gap-2 lg:items-start p-3 lg:p-0 border lg:border-0 border-border rounded-lg lg:rounded-none">
                  <div className="lg:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Description</div>
                  <div className="flex-1">
                    <input 
                      className={inputCls} 
                      placeholder="Description"
                      value={item.description} 
                      onChange={e => updateItem(item.id, "description", e.target.value)} 
                    />
                  </div>
                  <div className="lg:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Quantity</div>
                  <div className="w-full lg:w-20">
                    <input 
                      className={inputCls} 
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || ""} 
                      onChange={e => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="lg:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Unit Price (₦)</div>
                  <div className="w-full lg:w-28">
                    <input 
                      className={inputCls} 
                      type="number"
                      placeholder="Price"
                      value={item.unitPrice || ""} 
                      onChange={e => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                  <div className="lg:hidden text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Total</div>
                  <div className="w-full lg:w-24 flex items-center justify-between lg:justify-end py-2 lg:py-0">
                    <span className="lg:hidden font-medium">Total: </span>
                    <span className="text-sm font-medium">₦{(item.quantity * item.unitPrice).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-muted-foreground hover:text-destructive self-end lg:self-center"
                    disabled={items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="mt-3 text-xs uppercase tracking-[0.25em] text-gold hover:underline">
              + Add Item
            </button>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">Notes / Terms</span>
            <textarea 
              className={`${inputCls} min-h-[100px]`} 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              placeholder="Payment terms, additional notes..."
            />
          </label>

          <button 
            onClick={saveReceipt}
            className="inline-flex items-center gap-2 bg-ink text-bone px-5 py-3 text-xs uppercase tracking-[0.25em] hover:bg-ink/90 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>

        <div className="hidden lg:block bg-card border border-border p-6">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Preview</div>
          <div ref={printRef} className="font-serif">
            <div className="flex justify-between items-baseline border-b-2 border-ink pb-4 mb-6">
              <div className="font-display text-2xl">{branding.brandName}</div>
              <div className="text-xl uppercase tracking-widest">{docType}</div>
            </div>
            
            <div className="text-right text-sm mb-6">
              <div>{docNumber}</div>
              <div className="text-muted-foreground">{today}</div>
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Bill To</div>
              <div className="font-medium">{clientName || "Client Name"}</div>
              <div className="text-sm text-muted-foreground">{clientEmail}</div>
              <div className="text-sm text-muted-foreground">{clientPhone}</div>
              <div className="text-sm text-muted-foreground">{clientAddress}</div>
            </div>

            <table className="w-full mb-6">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right py-2 text-xs uppercase tracking-wider">Qty</th>
                  <th className="text-right py-2 text-xs uppercase tracking-wider">Price</th>
                  <th className="text-right py-2 text-xs uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-3">{item.description || "—"}</td>
                    <td className="text-right py-3">{item.quantity}</td>
                    <td className="text-right py-3">₦{item.unitPrice.toLocaleString()}</td>
                    <td className="text-right py-3">₦{(item.quantity * item.unitPrice).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-ink font-bold text-lg">
                  <span>Total</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {notes && (
              <div className="mt-6 p-4 bg-muted/50">
                <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Notes</div>
                <div className="text-sm">{notes}</div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:hidden bg-card border border-border p-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Total</span>
            <span className="font-display text-2xl">₦{subtotal.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}