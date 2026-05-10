import { useStoreBase } from '@/lib/store';
import { AdminPage, Field, inputCls, PrimaryBtn, GhostBtn } from './_shared';
import { useState } from 'react';
import type { Employee, Role, AdminTab } from '@/lib/types';
import { toast } from 'sonner';
import { employeeSchema } from '@/lib/validation';
import { useConfirm } from '@/components/ConfirmProvider';
import { useCurrentEmployee } from '@/lib/store';
import { upsertRole, deleteRole, setEmployeeRole, loadEmployees } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

const ALL_TABS: AdminTab[] = ['branding', 'content', 'hotels', 'rooms', 'halls', 'packages', 'rentals', 'inventory', 'bookings', 'employees'];

const blankEmp = (roleId: string): Employee => ({ id: crypto.randomUUID(), name: '', email: '', password: '', roleId });
const blankRole = (): Role => ({ id: crypto.randomUUID(), name: '', tabs: [] });

export default function AdminEmployees() {
  const employees = useStoreBase(s => s.employees);
  const roles = useStoreBase(s => s.roles);
  const set = useStoreBase(s => s.set);
  const me = useCurrentEmployee();
  const { confirm } = useConfirm();

  const [emp, setEmp] = useState<Employee | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveEmp = async () => {
    if (!emp) return;
    const exists = employees.some(e => e.id === emp.id);
    // Existing user → only update role mapping
    if (exists) {
      if (!emp.roleId) { setErrors({ roleId: 'Pick a role' }); return; }
      setErrors({});
      set('employees', employees.map(e => e.id === emp.id ? emp : e));
      setEmp(null);
      try { await setEmployeeRole(emp.id, emp.roleId); toast.success('Role updated.'); }
      catch (e: any) { toast.error(e?.message ?? 'Update failed'); }
      return;
    }
    // New user → validate + edge function
    const res = employeeSchema.safeParse(emp);
    if (!res.success) {
      const m: Record<string, string> = {};
      res.error.issues.forEach(i => { m[i.path.join('.')] = i.message; });
      setErrors(m); return;
    }
    setErrors({});
    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: { name: emp.name, email: emp.email, password: emp.password, roleId: emp.roleId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const fresh = await loadEmployees();
      set('employees', fresh);
      setEmp(null);
      toast.success('Employee created.');
    } catch (e: any) {
      toast.error(e?.message ?? 'Create failed');
    }
  };

  const saveRole = async () => {
    if (!role || !role.name.trim()) { toast.error('Name required.'); return; }
    const exists = roles.some(r => r.id === role.id);
    set('roles', exists ? roles.map(r => r.id === role.id ? role : r) : [...roles, role]);
    setRole(null);
    try { await upsertRole(role); toast.success('Role saved.'); }
    catch (e: any) { toast.error(e?.message ?? 'Save failed'); }
  };

  const removeEmp = async (e: Employee) => {
    if (e.id === me?.id) return toast.error("You can't delete yourself.");
    if (await confirm({ title: `Delete ${e.name}?`, destructive: true, confirmText: 'Delete' })) {
      // We don't delete the auth user from the client; just unset their role.
      set('employees', employees.filter(x => x.id !== e.id));
      try { await setEmployeeRole(e.id, ''); } catch { /* ignore */ }
      toast.success('Employee removed from staff list.');
    }
  };
  const removeRole = async (r: Role) => {
    if (employees.some(e => e.roleId === r.id)) return toast.error('Role is in use.');
    if (await confirm({ title: `Delete role ${r.name}?`, destructive: true, confirmText: 'Delete' })) {
      set('roles', roles.filter(x => x.id !== r.id));
      try { await deleteRole(r.id); } catch (e: any) { toast.error(e?.message ?? 'Delete failed'); }
    }
  };

  return (
    <AdminPage title="Employees & roles" subtitle="Create staff accounts and decide which CMS tabs they see."
      action={<div className="flex gap-2"><PrimaryBtn onClick={() => setRole(blankRole())}>+ Role</PrimaryBtn><PrimaryBtn onClick={() => setEmp(blankEmp(roles[0]?.id || ''))}>+ Employee</PrimaryBtn></div>}>
      <h2 className="font-display text-2xl mb-3">Employees</h2>
      <div className="border border-border divide-y divide-border bg-card mb-12">
        {employees.map(e => {
          const r = roles.find(x => x.id === e.roleId);
          return (
            <div key={e.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 p-4 items-center">
              <div>
                <div className="font-display text-lg">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.email}</div>
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold">{r?.name ?? '—'}</span>
              <GhostBtn onClick={() => setEmp(e)}>Edit</GhostBtn>
              <GhostBtn onClick={() => removeEmp(e)}>Delete</GhostBtn>
            </div>
          );
        })}
      </div>

      <h2 className="font-display text-2xl mb-3">Roles</h2>
      <div className="border border-border divide-y divide-border bg-card">
        {roles.map(r => (
          <div key={r.id} className="grid grid-cols-[200px_1fr_auto_auto] gap-4 p-4 items-center">
            <div className="font-display text-lg">{r.name}</div>
            <div className="flex flex-wrap gap-1">
              {r.tabs.map(t => <span key={t} className="text-[10px] uppercase tracking-[0.25em] border border-border px-2 py-1">{t}</span>)}
              {r.tabs.length === 0 && <span className="text-xs text-muted-foreground">No tabs</span>}
            </div>
            <GhostBtn onClick={() => setRole(r)}>Edit</GhostBtn>
            <GhostBtn onClick={() => removeRole(r)}>Delete</GhostBtn>
          </div>
        ))}
      </div>

      {emp && (
        <Modal onClose={() => setEmp(null)} title="Employee">
          <div className="grid md:grid-cols-2 gap-4">
            <FieldErr label="Name" err={errors.name}><input className={inputCls} value={emp.name} onChange={e => setEmp({ ...emp, name: e.target.value })}/></FieldErr>
            <FieldErr label="Email" err={errors.email}><input className={inputCls} value={emp.email} onChange={e => setEmp({ ...emp, email: e.target.value })}/></FieldErr>
            <FieldErr label="Password" err={errors.password}><input type="text" className={inputCls} value={emp.password} onChange={e => setEmp({ ...emp, password: e.target.value })}/></FieldErr>
            <FieldErr label="Role" err={errors.roleId}>
              <select className={inputCls} value={emp.roleId} onChange={e => setEmp({ ...emp, roleId: e.target.value })}>
                <option value="">— pick —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </FieldErr>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <GhostBtn onClick={() => setEmp(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveEmp}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {role && (
        <Modal onClose={() => setRole(null)} title="Role">
          <Field label="Name"><input className={inputCls} value={role.name} onChange={e => setRole({ ...role, name: e.target.value })}/></Field>
          <div className="mt-4">
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-2">CMS tabs this role can view</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_TABS.map(t => {
                const checked = role.tabs.includes(t);
                return (
                  <label key={t} className={`flex items-center gap-2 border p-2 cursor-pointer text-sm ${checked ? 'border-gold bg-secondary' : 'border-border'}`}>
                    <input type="checkbox" checked={checked} onChange={e =>
                      setRole({ ...role, tabs: e.target.checked ? [...role.tabs, t] : role.tabs.filter(x => x !== t) })
                    }/>
                    {t}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex gap-2 justify-end">
            <GhostBtn onClick={() => setRole(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={saveRole}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}
    </AdminPage>
  );
}

function FieldErr({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">{label}</span>
      {children}
      {err && <span className="text-destructive text-xs mt-1 block">{err}</span>}
    </label>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-ink/80 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-card border border-border w-full max-w-2xl p-8 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-3xl mb-6">{title}</h2>
        {children}
      </div>
    </div>
  );
}
