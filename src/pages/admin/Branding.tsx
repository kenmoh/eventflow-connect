import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn } from './_shared';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminBranding() {
  const branding = useStoreBase(s => s.branding);
  const set = useStoreBase(s => s.set);
  const [b, setB] = useState(branding);
  const save = async () => {
    set('branding', b);
    const { saveBranding } = await import('@/lib/db');
    try { await saveBranding(b); toast.success('Branding updated.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };
  return (
    <AdminPage title="Branding" subtitle="Name and tagline — applied across the entire site.">
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <Field label="Brand name"><input className={inputCls} value={b.brandName} onChange={e => setB({ ...b, brandName: e.target.value })}/></Field>
        <Field label="Tagline"><input className={inputCls} value={b.tagline} onChange={e => setB({ ...b, tagline: e.target.value })}/></Field>
      </div>
      <div className="mt-8"><PrimaryBtn onClick={save}>Save changes</PrimaryBtn></div>
    </AdminPage>
  );
}
