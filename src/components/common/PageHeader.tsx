import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string | undefined;
  title: string;
  description?: string | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary-ink">{eyebrow}</p>
        )}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {children}
    </header>
  );
}
