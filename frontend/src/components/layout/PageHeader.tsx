import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export function PageHeader({ title, description, actions, meta }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
