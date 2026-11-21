import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export const Dropdown = DropdownMenu.Root;
export const DropdownTrigger = DropdownMenu.Trigger;

export function DropdownContent({
  children,
  align = 'end',
  className,
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-[60] min-w-[190px] rounded-lg border border-line bg-surface p-1.5 shadow-float animate-dialog-in',
          className,
        )}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
}

export function DropdownItem({
  children,
  onSelect,
  disabled,
  destructive,
}: {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs font-medium text-ink outline-none transition hover:bg-subtle focus:bg-subtle data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        destructive && 'text-danger hover:bg-danger/10 focus:bg-danger/10',
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
      {children}
    </DropdownMenu.Label>
  );
}

export function DropdownSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}
