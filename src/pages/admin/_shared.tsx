import { ReactNode } from "react";

export function AdminPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-10 w-full max-w-full mx-auto box-border">
      <div className="flex items-end justify-between mb-6 lg:mb-10 gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 hidden sm:block">
            CMS
          </div>
          <h1 className="font-display text-3xl lg:text-5xl">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full bg-transparent border border-border px-3 py-2 outline-none focus:border-gold text-sm";

export function PrimaryBtn(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <button
      {...props}
      className={`bg-ink text-bone px-5 py-3 text-xs uppercase tracking-[0.25em] hover:bg-ink/90 transition ${props.className || ""}`}
    />
  );
}
export function GhostBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`border border-border px-4 py-2 text-xs uppercase tracking-[0.25em] hover:bg-secondary transition ${props.className || ""}`}
    />
  );
}
