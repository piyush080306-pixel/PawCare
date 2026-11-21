import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Heart,
  PawPrint,
  Plus,
  ShieldCheck,
  Stethoscope,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import {
  AdoptionStatusChart,
  AdoptionTrendChart,
  RadialGauge,
  SpeciesDonut,
} from '@/components/charts/Charts';
import {
  OperationalAlerts,
  RecentAnimals,
  RecentApplications,
  StaffMiniCard,
  StatCard,
} from '@/components/dashboard/DashboardWidgets';
import {
  useAdoptions,
  useAnimals,
  useDashboard,
  useReports,
} from '@/services/api/queries';
import { greeting, longDate, speciesLabel } from '@/utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboard = useDashboard();
  const reports = useReports();
  const animalsQuery = useAnimals();
  const adoptionsQuery = useAdoptions();

  if (dashboard.isError) {
    return (
      <ErrorState
        message={dashboard.error instanceof Error ? dashboard.error.message : 'Unable to load dashboard.'}
        onRetry={() => void dashboard.refetch()}
      />
    );
  }

  const metrics = dashboard.data;
  const stats = metrics?.stats;
  const animals = animalsQuery.data ?? [];
  const adoptions = adoptionsQuery.data ?? [];
  const health = metrics?.upcoming ?? [];
  const loading = dashboard.isLoading || animalsQuery.isLoading || adoptionsQuery.isLoading;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title={`${greeting()}, Admin`}
        description={`Here's what's happening across your shelter today · ${longDate()}`}
        actions={
          <Button variant="primary" onClick={() => navigate('/animals?new=1')}>
            <Plus className="h-4 w-4" /> Register animal
          </Button>
        }
      />

      {loading || !metrics || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="panel space-y-3 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-14" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            title="Total animals"
            value={stats.totalAnimals}
            icon={<PawPrint className="h-4 w-4" />}
            description={`${stats.totalDogs} dogs · ${stats.totalCats} cats · ${stats.totalBirds} birds`}
          />
          <StatCard
            title="Available"
            value={stats.availableAnimals}
            icon={<Heart className="h-4 w-4" />}
            description="Ready for adoption"
            tone="success"
          />
          <StatCard
            title="Adopted"
            value={stats.adoptedAnimals}
            icon={<ShieldCheck className="h-4 w-4" />}
            description={`${metrics.adoptionRate.toFixed(1)}% of all animals`}
            tone="info"
          />
          <StatCard
            title="Pending applications"
            value={stats.pendingApplications}
            icon={<ClipboardList className="h-4 w-4" />}
            description={`${stats.approvedApplications} approved · ${stats.rejectedApplications} rejected`}
            tone="warning"
          />
          <StatCard
            title="Total staff"
            value={stats.totalStaff}
            icon={<Users className="h-4 w-4" />}
            description="Across all roles"
            tone="brand"
          />
          <StatCard
            title="Medical records"
            value={stats.totalMedicalRecords}
            icon={<Stethoscope className="h-4 w-4" />}
            description={`${metrics?.upcoming?.length ?? 0} upcoming vaccinations`}
            tone="danger"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Animal population overview"
          subtitle="Distribution by registered category"
          className="xl:col-span-1"
          action={
            <button
              type="button"
              onClick={() => navigate('/animals')}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              View directory
            </button>
          }
        >
          {loading || !metrics ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <div>
              <SpeciesDonut
                data={metrics.categories}
                onSelect={label => navigate(`/animals?species=${label}`)}
              />
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {metrics.categories.map(category => (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => navigate(`/animals?species=${category.label}`)}
                    className="rounded-md border border-line bg-subtle px-2 py-1 text-[11px] text-muted transition hover:border-brand/30 hover:text-ink"
                  >
                    {speciesLabel(category.label)} · <span className="num">{category.count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Adoption overview"
          subtitle="Application outcomes from live records"
          className="xl:col-span-2"
        >
          {loading || !metrics ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <AdoptionStatusChart
                data={[
                  { label: 'Approved', count: metrics.stats.approvedApplications },
                  { label: 'Pending', count: metrics.stats.pendingApplications },
                  { label: 'Rejected', count: metrics.stats.rejectedApplications },
                ]}
              />
              <div className="flex flex-col justify-center gap-5">
                <RadialGauge
                  value={metrics.adoptionRate}
                  label="Adoption rate"
                  caption="Adopted animals ÷ total animals"
                />
                <RadialGauge
                  value={metrics.successRate}
                  label="Application success"
                  caption="Approved ÷ all applications"
                  tone="#D49A43"
                />
              </div>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Adoption activity" subtitle="Approved adoptions by month" className="xl:col-span-2">
          {reports.isLoading ? <Skeleton className="h-[260px]" /> : <AdoptionTrendChart data={reports.data?.monthly ?? []} />}
        </Panel>
        <Panel title="Operational alerts" subtitle="Items that need attention">
          <OperationalAlerts
            applications={adoptions}
            health={health}
            animals={animals}
            onApplication={id => navigate(`/adoptions/${id}`)}
            onVaccination={() => navigate('/health?view=vaccinations')}
            onAnimal={id => navigate(`/animals/${id}`)}
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Recently registered"
          subtitle="Latest animals in the shelter"
          action={
            <button
              type="button"
              onClick={() => navigate('/animals')}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              All animals
            </button>
          }
        >
          <RecentAnimals animals={animals.slice(0, 5)} onView={id => navigate(`/animals/${id}`)} />
        </Panel>
        <Panel
          title="Recent applications"
          subtitle="Latest adoption requests"
          action={
            <button
              type="button"
              onClick={() => navigate('/adoptions')}
              className="text-[11px] font-semibold text-brand hover:underline"
            >
              All applications
            </button>
          }
        >
          <RecentApplications
            applications={adoptions.slice(0, 5)}
            onView={id => navigate(`/adoptions/${id}`)}
          />
        </Panel>
        <Panel title="Staff capacity" subtitle="Headcount by role">
          {loading || !metrics ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="space-y-2">
              <StaffMiniCard role="Manager" count={metrics.roles.find(r => r.label === 'MANAGER')?.count ?? 0} icon={<ShieldCheck className="h-4 w-4" />} />
              <StaffMiniCard role="Veterinarian" count={metrics.roles.find(r => r.label === 'VETERINARIAN')?.count ?? 0} icon={<Stethoscope className="h-4 w-4" />} />
              <StaffMiniCard role="Caretaker" count={metrics.roles.find(r => r.label === 'CARETAKER')?.count ?? 0} icon={<Users className="h-4 w-4" />} />
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
