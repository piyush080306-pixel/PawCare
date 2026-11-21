import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation } from 'react-router-dom';
import { Keyboard, Server } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalSearch } from './GlobalSearch';
import { Modal } from '@/components/ui/Modal';
import { useUiStore } from '@/store/ui';
import { API_BASE_URL } from '@/services/api/apiClient';
import { cn } from '@/utils/format';

function HelpModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Help & support"
      description="Keyboard shortcuts and backend connection details."
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-subtle/60 p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-ink">
            <Keyboard className="h-4 w-4 text-brand" /> Keyboard shortcuts
          </p>
          <ul className="space-y-2 text-xs text-muted">
            <li className="flex items-center justify-between">
              Open global search <span className="kbd">⌘ / Ctrl + K</span>
            </li>
            <li className="flex items-center justify-between">
              Close dialogs <span className="kbd">Esc</span>
            </li>
          </ul>
        </div>
        <div className="rounded-lg border border-line bg-subtle/60 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-ink">
            <Server className="h-4 w-4 text-brand" /> Connected service
          </p>
          <p className="break-all font-mono text-[11px] text-muted">{API_BASE_URL}</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted">
            PawCare delegates every write and statistic to the Scala 3 service layer. See
            <code className="mx-1 rounded bg-surface px-1 py-0.5">docs/BACKEND_INTEGRATION.md</code>
            for the supported contract.
          </p>
        </div>
      </div>
    </Modal>
  );
}

export function MainLayout() {
  const collapsed = useUiStore(state => state.sidebarCollapsed);
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar onHelp={() => setHelpOpen(true)} />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[248px]',
        )}
      >
        <Topbar />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
              className="mx-auto w-full max-w-[1440px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <GlobalSearch />
      <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
