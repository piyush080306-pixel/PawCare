import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const TONES: Record<Tone, string> = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-info/20 bg-info/10 text-info',
  neutral: 'border-line bg-subtle text-muted',
  brand: 'border-brand/20 bg-brand-soft text-brand',
};

const STATUS_MAP: Record<string, Tone> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  AVAILABLE: 'success',
  ADOPTED: 'info',
  TREATMENT: 'warning',
  UNDER_TREATMENT: 'warning',
  HEALTHY: 'success',
  VACCINATED: 'success',
  PARTIAL: 'warning',
  UNVACCINATED: 'danger',
  SCHEDULED: 'info',
  COMPLETED: 'success',
  OVERDUE: 'danger',
  DOG: 'info',
  CAT: 'warning',
  BIRD: 'success',
  MANAGER: 'brand',
  VETERINARIAN: 'info',
  CARETAKER: 'neutral',
};

export function toneFor(value: string): Tone {
  return STATUS_MAP[value.toUpperCase().replace(/ /g, '_')] ?? 'neutral';
}

interface StatusBadgeProps {
  value: string;
  label?: ReactNode;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({ value, label, dot = true, className }: StatusBadgeProps) {
  const tone = toneFor(value);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]',
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {label ?? value}
    </span>
  );
}
