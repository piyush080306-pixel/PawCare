import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange} className={className}>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex flex-wrap items-center gap-1 rounded-lg border border-line bg-surface p-1',
        className,
      )}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  value,
  children,
  count,
}: {
  value: string;
  children: ReactNode;
  count?: number;
}) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 data-[state=active]:bg-brand data-[state=active]:text-white dark:data-[state=active]:text-[#121812]"
    >
      {children}
      {count !== undefined ? (
        <span className="num rounded bg-subtle px-1.5 py-0.5 text-[10px] text-muted">{count}</span>
      ) : null}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsPrimitive.Content value={value} className={cn('mt-4 focus:outline-none', className)}>
      {children}
    </TabsPrimitive.Content>
  );
}
