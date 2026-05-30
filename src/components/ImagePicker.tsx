import { useRef, useState } from 'react';
import { Upload, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImagePicker({
  value, onChange, label = 'Image',
}: { value: string; onChange: (v: string) => void; label?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'url' | 'upload'>('url');
  const [busy, setBusy] = useState(false);

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    const { uploadImage } = await import('@/lib/db');
    setBusy(true);
    try {
      const url = await uploadImage(f);
      onChange(url);
      toast.success('Uploaded.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">{label}</span>
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setMode('url')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-[0.25em] border ${mode === 'url' ? 'border-gold bg-secondary' : 'border-border'}`}>
          <Link2 className="w-3 h-3" /> URL
        </button>
        <button type="button" onClick={() => setMode('upload')}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-[0.25em] border ${mode === 'upload' ? 'border-gold bg-secondary' : 'border-border'}`}>
          <Upload className="w-3 h-3" /> Upload
        </button>
      </div>
      {mode === 'url' ? (
        <input className="field" placeholder="https://…" value={value.startsWith('data:') ? '' : value}
          onChange={e => onChange(e.target.value)} />
      ) : (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => onFile(e.target.files?.[0] ?? null)} />
          <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}
            className="w-full border border-dashed border-border py-3 text-xs uppercase tracking-[0.25em] hover:bg-secondary inline-flex items-center justify-center gap-2 disabled:opacity-50">
            {busy ? <><Loader2 className="w-3 h-3 animate-spin"/> Uploading…</> : 'Select image…'}
          </button>
        </>
      )}
      {value && (
        <div className="mt-3 aspect-video bg-muted overflow-hidden border border-border">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
