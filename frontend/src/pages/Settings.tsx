import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  CircleHelp,
  Database,
  Keyboard,
  Monitor,
  Moon,
  RotateCcw,
  Server,
  Settings2,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { useUiStore } from '@/store/ui';
import { toast } from '@/store/toast';
import { useDashboard } from '@/services/api/queries';
import { API_BASE_URL } from '@/services/api/apiClient';
import { cn } from '@/utils/format';

type Density = 'comfortable' | 'compact';

const DENSITY_KEY = 'pawcare:density';
const MOTION_KEY = 'pawcare:reduce-motion';

function readStored(key: string): boolean {
  try {
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

function PreferenceToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line bg-subtle/40 p-3.5">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted">{description}</span>
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={event => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="h-5 w-9 rounded-full bg-line transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-surface shadow-sm transition peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);
  const toggleTheme = useUiStore(state => state.toggleTheme);
  const dashboard = useDashboard();

  const [tab, setTab] = useState(searchParams.get('view') === 'help' ? 'help' : 'general');
  const [density, setDensity] = useState<Density>(() =>
    readStored(DENSITY_KEY) ? 'compact' : 'comfortable',
  );
  const [reduceMotion, setReduceMotion] = useState(() => readStored(MOTION_KEY));

  useEffect(() => {
    const body = document.body;
    body.classList.toggle('pawcare-compact', density === 'compact');
    try {
      localStorage.setItem(DENSITY_KEY, String(density === 'compact'));
    } catch {
      // Preferences still apply for this session.
    }
  }, [density]);

  useEffect(() => {
    document.body.classList.toggle('pawcare-reduce-motion', reduceMotion);
    try {
      localStorage.setItem(MOTION_KEY, String(reduceMotion));
    } catch {
      // Preferences still apply for this session.
    }
  }, [reduceMotion]);

  const reset = () => {
    setTheme('light');
    setDensity('comfortable');
    setReduceMotion(false);
    toast.success('Display preferences reset');
  };

  const stats = dashboard.data?.stats;

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Settings"
        description="Application preferences, shelter information and integration details."
        actions={
          <Button size="sm" variant="secondary" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset preferences
          </Button>
        }
      />

      <Panel padded={false}>
        <Tabs value={tab} onValueChange={setTab} className="p-4 sm:p-5">
          <TabsList>
            <TabsTrigger value="general">
              <Settings2 className="h-3.5 w-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="shelter">
              <ShieldCheck className="h-3.5 w-3.5" /> Shelter
            </TabsTrigger>
            <TabsTrigger value="display">
              <Monitor className="h-3.5 w-3.5" /> Display
            </TabsTrigger>
            <TabsTrigger value="application">
              <Database className="h-3.5 w-3.5" /> Application
            </TabsTrigger>
            <TabsTrigger value="help">
              <CircleHelp className="h-3.5 w-3.5" /> Help
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="max-w-3xl">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Appearance</h3>
                <p className="mt-1 text-xs text-muted">
                  Choose how PawCare looks on this device. Your selection is saved locally.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    value: 'light' as const,
                    label: 'Light',
                    detail: 'Warm neutral workspace',
                    icon: <Sun className="h-4 w-4" />,
                  },
                  {
                    value: 'dark' as const,
                    label: 'Dark',
                    detail: 'Low-light workspace',
                    icon: <Moon className="h-4 w-4" />,
                  },
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-4 text-left transition',
                      theme === option.value
                        ? 'border-brand bg-brand-soft/60'
                        : 'border-line bg-surface hover:border-brand/30',
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-brand shadow-sm">
                      {option.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-ink">{option.label}</span>
                      <span className="block text-[11px] text-muted">{option.detail}</span>
                    </span>
                    <span
                      className={cn(
                        'h-3.5 w-3.5 rounded-full border-2',
                        theme === option.value ? 'border-brand bg-brand' : 'border-line',
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="rounded-lg border border-line bg-subtle/40 p-4">
                <p className="text-xs font-semibold text-ink">Quick theme switch</p>
                <p className="mt-1 text-[11px] text-muted">
                  You can also change the theme from the account menu in the top bar.
                </p>
                <Button className="mt-3" size="sm" variant="secondary" onClick={toggleTheme}>
                  Switch to {theme === 'dark' ? 'light' : 'dark'} mode
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="shelter" className="max-w-3xl">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Shelter information</h3>
                <p className="mt-1 text-xs text-muted">
                  The backend does not expose a configurable shelter profile, so only live aggregate
                  data is shown here.
                </p>
              </div>
              {dashboard.isError ? (
                <ErrorState
                  message={
                    dashboard.error instanceof Error
                      ? dashboard.error.message
                      : 'Unable to load shelter figures.'
                  }
                  onRetry={() => void dashboard.refetch()}
                />
              ) : dashboard.isLoading || !stats ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-16" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Registered animals', stats.totalAnimals],
                    ['Available animals', stats.availableAnimals],
                    ['Adopted animals', stats.adoptedAnimals],
                    ['Staff members', stats.totalStaff],
                    ['Open applications', stats.pendingApplications],
                    ['Medical records', stats.totalMedicalRecords],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-line bg-subtle/40 p-4">
                      <p className="text-[11px] text-muted">{label}</p>
                      <p className="num mt-1 font-display text-xl font-semibold text-ink">{value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="display" className="max-w-3xl">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Display preferences</h3>
                <p className="mt-1 text-xs text-muted">
                  These settings change only your browser presentation and never alter stored records.
                </p>
              </div>
              <PreferenceToggle
                title="Compact tables"
                description="Reduce row and cell spacing across data tables."
                checked={density === 'compact'}
                onChange={checked => setDensity(checked ? 'compact' : 'comfortable')}
              />
              <PreferenceToggle
                title="Reduce motion"
                description="Disable page transitions and non-essential animations."
                checked={reduceMotion}
                onChange={setReduceMotion}
              />
            </div>
          </TabsContent>

          <TabsContent value="application" className="max-w-3xl">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Application information</h3>
                <p className="mt-1 text-xs text-muted">
                  PawCare is a React client for the existing Scala service layer.
                </p>
              </div>
              <div className="divide-y divide-line rounded-lg border border-line bg-subtle/40">
                {[
                  ['Product', 'PawCare · Smart Animal Shelter Management Platform'],
                  ['Frontend', 'React 19 · TypeScript · Vite · Tailwind CSS'],
                  ['Backend', 'Scala 3 · SQLite · existing service layer'],
                  ['Data authority', 'All writes and statistics are performed by the backend'],
                  ['API endpoint', API_BASE_URL],
                  ['Integration guide', 'PawCare/docs/BACKEND_INTEGRATION.md'],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center">
                    <span className="w-40 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      {label}
                    </span>
                    <span className="break-all text-[13px] text-ink">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
                <Server className="mt-0.5 h-4 w-4 shrink-0 text-info" />
                <p className="text-xs leading-relaxed text-muted">
                  Authentication, account management and shelter profile persistence are intentionally
                  not exposed because the current backend does not implement them.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="help" className="max-w-3xl">
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-sm font-semibold text-ink">Help & support</h3>
                <p className="mt-1 text-xs text-muted">
                  Keyboard shortcuts and workflow guidance for shelter staff.
                </p>
              </div>
              <div className="rounded-lg border border-line bg-subtle/40 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Keyboard className="h-4 w-4 text-brand" /> Keyboard shortcuts
                </p>
                <ul className="mt-3 space-y-2 text-xs text-muted">
                  <li className="flex items-center justify-between gap-4">
                    Open global search <span className="kbd">⌘ / Ctrl + K</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    Move between search results <span className="kbd">↑</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    Open highlighted result <span className="kbd">↵</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    Close dialogs <span className="kbd">Esc</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-subtle/40 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-ink">
                  <Activity className="h-4 w-4 text-brand" /> Common workflows
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted">
                  <li>Register animals with their category-specific details.</li>
                  <li>Submit an application for an available animal.</li>
                  <li>Approve or reject the application from the adoption workspace.</li>
                  <li>Log medical records and update vaccination status from the health workspace.</li>
                  <li>Review live figures in the analytics workspace.</li>
                </ol>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete('view');
                  setSearchParams(next, { replace: true });
                  setTab('general');
                }}
              >
                Back to general settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Panel>
    </div>
  );
}
