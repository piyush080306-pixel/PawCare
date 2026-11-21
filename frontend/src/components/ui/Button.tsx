import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-hover dark:text-[#121812]',
  secondary: 'border border-line bg-surface text-ink hover:bg-subtle',
  ghost: 'text-muted hover:bg-subtle hover:text-ink',
  danger: 'border border-danger/25 bg-danger/10 text-danger hover:bg-danger/15',
  outline: 'border border-brand/30 bg-brand-soft/50 text-brand hover:bg-brand-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-md px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-[13px]',
  icon: 'h-9 w-9 rounded-lg',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = 'secondary', size = 'md', asChild, loading, children, disabled, ...props },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref}
        className={cn(
          'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-50',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        disabled={asChild ? undefined : disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {children}
      </Component>
    );
  },
);
Button.displayName = 'Button';
