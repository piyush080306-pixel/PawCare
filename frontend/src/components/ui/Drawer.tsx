import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/format';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  eyebrow,
  children,
  footer,
  className,
}: DrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#101a13]/45 backdrop-blur-[2px] animate-overlay-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className={cn(
            'fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-line bg-surface shadow-float animate-drawer-in focus:outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {eyebrow}
                </p>
              ) : null}
              <Dialog.Title className="mt-0.5 truncate font-display text-lg font-semibold tracking-tight text-ink">
                {title}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="icon-button -mr-1" aria-label="Close panel">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer ? (
            <div className="border-t border-line bg-subtle/60 px-5 py-3">{footer}</div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
