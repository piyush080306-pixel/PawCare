import type { ReactNode } from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/utils/format';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} aria-hidden="true" />;
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="panel space-y-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="panel overflow-hidden">
      <div className="space-y-3 px-5 py-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="border-t border-line px-5 py-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 py-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-subtle text-muted">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-danger/20 bg-danger/10 text-danger">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="font-display text-sm font-semibold text-ink">Could not load this data</p>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">{message}</p>
      {onRetry ? (
        <Button className="mt-4" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
