import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn } from './_shared';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminBranding() {
  const branding = useStoreBase(s => s.branding);
  const set = useStoreBase(s => s.set);
  const [b, setB] = useState(branding);
  const save = () => { set('branding', b); toast.success('Branding updated.'); };
  return (
    <AdminPage title="Branding" subtitle="Name, tagline and accent — applied across the entire site.">
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <Field label="Brand name"><input className={inputCls} value={b.brandName} onChange={e => setB({ ...b, brandName: e.target.value })}/></Field>
        <Field label="Tagline"><input className={inputCls} value={b.tagline} onChange={e => setB({ ...b, tagline: e.target.value })}/></Field>
        <Field label="Accent (HSL — e.g. 38 60% 56%)">
          <div className="flex gap-3 items-center">
            <input className={inputCls} value={b.primaryAccent} onChange={e => setB({ ...b, primaryAccent: e.target.value })}/>
            <span className="w-10 h-10 border border-border" style={{ background: `hsl(${b.primaryAccent})` }} />
          </div>
        </Field>
      </div>
      <div className="mt-8"><PrimaryBtn onClick={save}>Save changes</PrimaryBtn></div>
    </AdminPage>
  );
}
