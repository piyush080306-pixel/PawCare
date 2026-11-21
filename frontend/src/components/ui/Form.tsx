import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/format';

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <label className="field-label">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <span className="mt-1 text-[11px] font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 text-[11px] text-muted">{hint}</span>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', className)} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn('select', className)}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn('textarea', className)} />;
}

export function Checkbox({
  label,
  description,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line bg-subtle/60 px-3 py-2.5">
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-4 w-4 rounded border-line text-brand accent-[rgb(var(--brand))]"
      />
      <span>
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {description ? <span className="block text-[11px] text-muted">{description}</span> : null}
      </span>
    </label>
  );
}
