import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore, type ToastKind } from '@/store/toast';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const;

const TONES: Record<ToastKind, string> = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-info',
};

export function Toaster() {
  const toasts = useToastStore(state => state.toasts);
  const dismiss = useToastStore(state => state.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      <AnimatePresence initial={false}>
        {toasts.map(item => {
          const Icon = ICONS[item.kind];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-float"
            >
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONES[item.kind]}`} />
              <p className="flex-1 text-xs leading-relaxed text-ink">{item.message}</p>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="text-muted transition hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
