import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type Ctx = {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  alert: (opts: Omit<ConfirmOptions, 'cancelText'>) => Promise<void>;
};

const ConfirmContext = createContext<Ctx | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<(ConfirmOptions & { resolver: (b: boolean) => void; mode: 'confirm' | 'alert' }) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>(res => {
    setOpts({ ...o, resolver: res, mode: 'confirm' });
  }), []);

  const alertFn = useCallback((o: Omit<ConfirmOptions, 'cancelText'>) => new Promise<void>(res => {
    setOpts({ ...o, resolver: () => res(), mode: 'alert' });
  }), []);

  const close = (val: boolean) => {
    opts?.resolver(val);
    setOpts(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert: alertFn }}>
      {children}
      <AlertDialog open={!!opts} onOpenChange={(o) => { if (!o) close(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{opts?.title ?? 'Are you sure?'}</AlertDialogTitle>
            {opts?.description && <AlertDialogDescription>{opts.description}</AlertDialogDescription>}
          </AlertDialogHeader>
          <AlertDialogFooter>
            {opts?.mode === 'confirm' && (
              <AlertDialogCancel onClick={() => close(false)}>{opts?.cancelText ?? 'Cancel'}</AlertDialogCancel>
            )}
            <AlertDialogAction
              onClick={() => close(true)}
              className={opts?.destructive ? 'bg-destructive hover:bg-destructive/90' : ''}>
              {opts?.confirmText ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const c = useContext(ConfirmContext);
  if (!c) throw new Error('useConfirm must be inside ConfirmProvider');
  return c;
}
