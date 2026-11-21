import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileBarChart, Info, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { StatCard } from '@/components/dashboard/DashboardWidgets';
import {
  AdoptionStatusChart,
  AdoptionTrendChart,
  HorizontalBarChart,
  RadialGauge,
  SpeciesDonut,
} from '@/components/charts/Charts';
import {
  useAdoptions,
  useAnimals,
  useDashboard,
  useHealth,
  useReports,
  useStaff,
} from '@/services/api/queries';
import type { CategoryCount, MedicalRecord, VaccinationStatus } from '@/types/shelter';
import { downloadCsv } from '@/utils/export';
import { roleLabel, speciesLabel } from '@/utils/format';

const VACCINATION_STATUSES: VaccinationStatus[] = ['VACCINATED', 'PARTIAL', 'UNVACCINATED'];

export default function Analytics() {
  const reports = useReports();
  const dashboard = useDashboard();
  const animalsQuery = useAnimals();
  const adoptionsQuery = useAdoptions();
  const staffQuery = useStaff();
  const healthQuery = useHealth();

  const latestByAnimal = useMemo(() => {
    const map = new Map<number, MedicalRecord>();
    for (const record of healthQuery.data ?? []) {
      const current = map.get(record.animalId);
      if (!current || record.id > current.id) map.set(record.animalId, record);
    }
    return [...map.values()];
  }, [healthQuery.data]);

  const vaccinationData = useMemo<CategoryCount[]>(
    () =>
      VACCINATION_STATUSES.map(status => ({
        label: status,
        count: latestByAnimal.filter(record => record.vaccinationStatus === status).length,
      })).filter(item => item.count > 0),
    [latestByAnimal],
  );

  const availableAdopted = useMemo(
    () => [
      { label: 'Available', count: reports.data?.available ?? 0 },
      { label: 'Adopted', count: reports.data?.adopted ?? 0 },
    ],
    [reports.data],
  );

  const loading =
    reports.isLoading ||
    dashboard.isLoading ||
    animalsQuery.isLoading ||
    adoptionsQuery.isLoading ||
    staffQuery.isLoading ||
    healthQuery.isLoading;

  const error = reports.error ?? dashboard.error;

  if (error) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load reports.'}
        onRetry={() => {
          void reports.refetch();
          void dashboard.refetch();
        }}
      />
    );
  }

  const metrics = reports.data;
  const stats = dashboard.data?.stats;

  const exportReport = (
    filename: string,
    headers: string[],
    rows: Array<Array<string | number>>,
  ) => downloadCsv(filename, headers, rows);

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Analytics & reports"
        description="Operational reporting calculated from live shelter records in the Scala backend."
        meta={
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] text-muted">
            <Info className="h-3 w-3" /> No synthetic or cached demo figures
          </span>
        }
      />

      {loading || !metrics || !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="panel space-y-3 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Total animals"
            value={animalsQuery.data?.length ?? stats.totalAnimals}
            icon={<TrendingUp className="h-4 w-4" />}
            description={`${metrics.available} available · ${metrics.adopted} adopted`}
          />
          <StatCard
            title="Adoption rate"
            value={Math.round(metrics.adoptionRate)}
            icon={<FileBarChart className="h-4 w-4" />}
            description="Adopted animals ÷ total animals (%)"
            tone="info"
          />
          <StatCard
            title="Success rate"
            value={Math.round(metrics.adoptionSuccessRate)}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Approved ÷ all applications (%)"
            tone="success"
          />
          <StatCard
            title="Medical records"
            value={healthQuery.data?.length ?? stats.totalMedicalRecords}
            icon={<FileBarChart className="h-4 w-4" />}
            description={`${latestByAnimal.length} animals with a record`}
            tone="warning"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Animal population distribution" subtitle="Registered categories">
          {loading || !metrics ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <div>
              <SpeciesDonut data={metrics.categories} />
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {metrics.categories.map(category => (
                  <span
                    key={category.label}
                    className="rounded-md border border-line bg-subtle px-2 py-1 text-[11px] text-muted"
                  >
                    {speciesLabel(category.label)} · <span className="num">{category.count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Adoption trends" subtitle="Approved adoptions by month" className="xl:col-span-2">
          {loading || !metrics ? (
            <Skeleton className="h-[260px]" />
          ) : (
            <AdoptionTrendChart data={metrics.monthly} />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Application outcomes" subtitle="All adoption applications">
          {loading || !stats ? (
            <Skeleton className="h-[250px]" />
          ) : (
            <AdoptionStatusChart
              data={[
                { label: 'Approved', count: stats.approvedApplications },
                { label: 'Pending', count: stats.pendingApplications },
                { label: 'Rejected', count: stats.rejectedApplications },
              ]}
            />
          )}
        </Panel>

        <Panel title="Performance gauges" subtitle="Rates reported by ReportService">
          {loading || !metrics ? (
            <Skeleton className="h-[220px]" />
          ) : (
            <div className="space-y-6">
              <RadialGauge
                value={metrics.adoptionRate}
                label="Adoption rate"
                caption="Adopted animals across the shelter"
              />
              <RadialGauge
                value={metrics.adoptionSuccessRate}
                label="Application success rate"
                caption="Approved outcomes from all applications"
                tone="#D49A43"
              />
            </div>
          )}
        </Panel>

        <Panel title="Availability" subtitle="Current shelter capacity">
          {loading || !metrics ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={availableAdopted.map(item => ({
                    name: item.label,
                    animals: item.count,
                  }))}
                  margin={{ top: 12, right: 12, bottom: 4, left: -18 }}
                >
                  <CartesianGrid vertical={false} stroke="rgb(var(--line))" strokeDasharray="3 3" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid rgb(var(--line))',
                      background: 'rgb(var(--surface))',
                      color: 'rgb(var(--ink))',
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="animals" radius={[6, 6, 0, 0]} barSize={42}>
                    {availableAdopted.map((entry, index) => (
                      <Cell key={entry.label} fill={index === 0 ? '#39865B' : '#668BAA'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Animal category statistics" subtitle="Counts by species">
          {loading || !metrics ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <HorizontalBarChart data={metrics.categories} color="#52745C" />
          )}
        </Panel>
        <Panel title="Staff distribution" subtitle="Headcount by designation">
          {loading || !metrics ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <HorizontalBarChart
              data={metrics.roles.map(role => ({
                ...role,
                label: roleLabel(role.label),
              }))}
              color="#668BAA"
            />
          )}
        </Panel>
        <Panel title="Vaccination overview" subtitle="Latest record per animal">
          {loading ? (
            <Skeleton className="h-[240px]" />
          ) : vaccinationData.length === 0 ? (
            <p className="py-20 text-center text-xs text-muted">No medical records have been logged.</p>
          ) : (
            <HorizontalBarChart
              data={vaccinationData.map(item => ({
                ...item,
                label: item.label.replace('_', ' '),
              }))}
              color="#D8A66A"
            />
          )}
        </Panel>
      </div>

      <Panel title="Export supported reports" subtitle="CSV files generated from the same live data">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || !metrics}
            onClick={() =>
              exportReport(
                'pawcare-monthly-adoptions.csv',
                ['Month', 'Approved adoptions'],
                (metrics?.monthly ?? []).map(item => [item.label, item.count]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Monthly adoptions
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || !metrics}
            onClick={() =>
              exportReport(
                'pawcare-animal-categories.csv',
                ['Category', 'Count'],
                (metrics?.categories ?? []).map(item => [item.label, item.count]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Animal categories
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || !metrics}
            onClick={() =>
              exportReport(
                'pawcare-staff-distribution.csv',
                ['Role', 'Count'],
                (metrics?.roles ?? []).map(item => [item.label, item.count]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Staff distribution
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={loading || vaccinationData.length === 0}
            onClick={() =>
              exportReport(
                'pawcare-vaccination-overview.csv',
                ['Status', 'Animals'],
                vaccinationData.map(item => [item.label, item.count]),
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Vaccination overview
          </Button>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-muted">
          Adoption outcomes are sourced from adoption applications; vaccination figures use the most
          recent stored medical record per animal. No figures are generated on the client.
        </p>
      </Panel>
    </div>
  );
}
