import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

interface PanelProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  padded?: boolean;
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
  padded = true,
}: PanelProps) {
  return (
    <section className={cn('panel flex min-w-0 flex-col', className)}>
      {title ? (
        <header className="panel-header">
          <div className="min-w-0">
            <h2 className="font-display text-sm font-semibold tracking-tight text-ink">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn('min-h-0 flex-1', padded && 'p-5', bodyClassName)}>{children}</div>
    </section>
  );
}
