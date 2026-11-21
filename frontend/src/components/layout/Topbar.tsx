import {
  ChevronRight,
  Menu,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { NotificationCenter } from './NotificationCenter';
import { NAV_GROUPS } from './Sidebar';
import { useUiStore } from '@/store/ui';
import { cn } from '@/utils/format';

function pageMeta(pathname: string): { title: string; group: string } {
  const flat = NAV_GROUPS.flatMap(group =>
    group.items.map(item => ({ ...item, group: group.label })),
  );
  const match = flat.find(item => item.to.split('?')[0] === pathname);
  if (match) return { title: match.label, group: match.group };
  if (pathname.startsWith('/animals/')) return { title: 'Animal profile', group: 'Shelter operations' };
  if (pathname.startsWith('/adoptions/')) return { title: 'Application details', group: 'Shelter operations' };
  return { title: 'Dashboard', group: 'Overview' };
}

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const setMobileNav = useUiStore(state => state.setMobileNav);
  const setSearchOpen = useUiStore(state => state.setSearchOpen);
  const theme = useUiStore(state => state.theme);
  const toggleTheme = useUiStore(state => state.toggleTheme);
  const meta = pageMeta(location.pathname);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
          <span className="truncate">{meta.group}</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate text-ink/70">{meta.title}</span>
        </div>
        <h1 className="mt-0.5 truncate font-display text-[15px] font-semibold tracking-tight text-ink">
          {meta.title}
        </h1>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="hidden h-9 w-56 items-center gap-2 rounded-lg border border-line bg-canvas px-3 text-xs text-muted transition hover:border-brand/40 hover:text-ink md:flex xl:w-72"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search animals, staff…</span>
        <span className="kbd">⌘K</span>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSearchOpen(true)}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <NotificationCenter />

      <Button
        variant="primary"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => navigate('/animals?new=1')}
      >
        <Plus className="h-4 w-4" /> Register animal
      </Button>

      <Dropdown>
        <DropdownTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand ring-2 ring-transparent transition hover:ring-brand/20"
            aria-label="Account menu"
          >
            SA
          </button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownLabel>Shelter Admin</DropdownLabel>
          <DropdownItem onSelect={() => navigate('/settings')}>
            <Settings className="h-3.5 w-3.5" /> Settings
          </DropdownItem>
          <DropdownItem onSelect={() => navigate('/settings')}>
            <UserRound className="h-3.5 w-3.5" /> Profile
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem onSelect={toggleTheme}>
            {theme === 'dark' ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </DropdownItem>
        </DropdownContent>
      </Dropdown>
    </header>
  );
}

export function TopbarTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className={cn('mb-5')}>
      <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
