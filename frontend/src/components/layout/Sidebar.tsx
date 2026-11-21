import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  ChevronLeft,
  ClipboardList,
  HeartHandshake,
  HelpCircle,
  LayoutDashboard,
  PawPrint,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/format';
import { useUiStore } from '@/store/ui';
import { Button } from '@/components/ui/Button';

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Shelter operations',
    items: [
      { to: '/animals', label: 'Animals', icon: PawPrint },
      { to: '/adoptions', label: 'Adoption applications', icon: ClipboardList },
      { to: '/adoption-records', label: 'Adoption records', icon: HeartHandshake },
      { to: '/staff', label: 'Staff management', icon: Users },
    ],
  },
  {
    label: 'Animal care',
    items: [
      { to: '/health', label: 'Health records', icon: Stethoscope },
      { to: '/health?view=vaccinations', label: 'Vaccinations', icon: Activity },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/analytics', label: 'Analytics & reports', icon: BarChart3 }],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/settings?view=help', label: 'Help & support', icon: HelpCircle },
    ],
  },
] as const;

interface SidebarContentProps {
  collapsed: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
  onHelp: () => void;
}

function SidebarContent({ collapsed, onToggle, onNavigate, onHelp }: SidebarContentProps) {
  const location = useLocation();

  const isItemActive = (to: string): boolean => {
    const target = new URL(to, window.location.origin);
    const actual = new URLSearchParams(location.search);
    const pathActive =
      location.pathname === target.pathname ||
      (target.pathname !== '/' && location.pathname.startsWith(`${target.pathname}/`));
    if (!pathActive) return false;
    const expectedQuery = [...target.searchParams.entries()].every(
      ([key, value]) => actual.get(key) === value,
    );
    const noConflictingView = target.searchParams.size > 0 || actual.get('view') === null;
    return expectedQuery && noConflictingView;
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-ink">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-white/10 px-4',
          collapsed && 'justify-center px-2',
        )}
      >
        <NavLink to="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white dark:text-[#121812]">
            <PawPrint className="h-5 w-5" />
          </span>
          {!collapsed ? (
            <span className="min-w-0">
              <span className="block font-display text-sm font-extrabold tracking-[0.16em]">
                PAWCARE
              </span>
              <span className="block truncate text-[10px] text-sidebar-ink/60">
                Shelter management
              </span>
            </span>
          ) : null}
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-5">
            {!collapsed ? (
              <p className="mb-2 px-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-sidebar-ink/40">
                {group.label}
              </p>
            ) : (
              <div className="mx-2 mb-3 h-px bg-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                if (item.label === 'Help & support') {
                  return (
                    <button
                      key={item.to}
                      type="button"
                      title={collapsed ? item.label : undefined}
                      onClick={() => {
                        onHelp();
                        onNavigate?.();
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] font-medium transition',
                        collapsed && 'justify-center px-0',
                        isItemActive(item.to)
                          ? 'bg-sidebar-active text-white'
                          : 'text-sidebar-ink/70 hover:bg-white/5 hover:text-sidebar-ink',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </button>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] font-medium transition',
                      collapsed && 'justify-center px-0',
                      isItemActive(item.to)
                        ? 'bg-sidebar-active text-white'
                        : 'text-sidebar-ink/70 hover:bg-white/5 hover:text-sidebar-ink',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {!collapsed ? (
          <div className="mb-2 flex items-center gap-2.5 rounded-lg bg-white/5 p-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-[#202923]">
              SA
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">Shelter Admin</p>
              <p className="truncate text-[10px] text-sidebar-ink/55">Administrator</p>
            </div>
            <ShieldCheck className="h-4 w-4 text-sidebar-ink/50" />
          </div>
        ) : null}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-2 py-2 text-[11px] font-medium text-sidebar-ink/60 transition hover:bg-white/5 hover:text-sidebar-ink"
          >
            <ChevronLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
            {!collapsed ? 'Collapse sidebar' : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function Sidebar({ onHelp }: { onHelp: () => void }) {
  const collapsed = useUiStore(state => state.sidebarCollapsed);
  const toggle = useUiStore(state => state.toggleSidebar);
  const mobileOpen = useUiStore(state => state.mobileNavOpen);
  const setMobileNav = useUiStore(state => state.setMobileNav);

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden shrink-0 transition-[width] duration-200 lg:block',
          collapsed ? 'w-[76px]' : 'w-[248px]',
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={toggle} onHelp={onHelp} />
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label="Close navigation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#101a13]/55 backdrop-blur-sm"
              onClick={() => setMobileNav(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 left-0 w-[280px] shadow-float"
            >
              <div className="absolute right-2 top-4 z-10">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-sidebar-ink hover:bg-white/10"
                  onClick={() => setMobileNav(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarContent
                collapsed={false}
                onNavigate={() => setMobileNav(false)}
                onHelp={() => {
                  onHelp();
                  setMobileNav(false);
                }}
              />
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
