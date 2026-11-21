import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  CalendarClock,
  ClipboardList,
  HeartHandshake,
  Stethoscope,
  Users,
} from 'lucide-react';
import type { AdoptionApplication, Animal, MedicalRecord } from '@/types/shelter';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { animalPhoto } from '@/utils/images';
import { animalSubtitle, daysUntil, dueLabel, formatDate, speciesLabel } from '@/utils/format';

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  description: string;
  tone?: 'brand' | 'info' | 'warning' | 'success' | 'danger';
}

const TONES = {
  brand: 'bg-brand-soft text-brand',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
};

export function StatCard({ title, value, icon, description, tone = 'brand' }: StatCardProps) {
  return (
    <div className="panel p-4 transition hover:border-brand/25">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium text-muted">{title}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
          {icon}
        </span>
      </div>
      <p className="num mt-2 font-display text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 truncate text-[11px] text-muted">{description}</p>
    </div>
  );
}

export function RecentAnimals({
  animals,
  onView,
}: {
  animals: Animal[];
  onView: (id: number) => void;
}) {
  if (animals.length === 0) {
    return <p className="py-10 text-center text-xs text-muted">No animals registered yet.</p>;
  }
  return (
    <div className="divide-y divide-line">
      {animals.map(animal => (
        <button
          key={animal.id}
          type="button"
          onClick={() => onView(animal.id)}
          className="group flex w-full items-center gap-3 py-2.5 text-left"
        >
          <img
            src={animalPhoto(animal)}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink">{animal.name}</span>
            <span className="block truncate text-[11px] text-muted">
              #{animal.id} · {speciesLabel(animal.category)} · {animal.age}y · {animalSubtitle(animal)}
            </span>
          </span>
          <StatusBadge
            value={animal.isAdopted ? 'ADOPTED' : 'AVAILABLE'}
            label={animal.isAdopted ? 'Adopted' : 'Available'}
          />
          <ArrowUpRight className="h-3.5 w-3.5 text-muted transition group-hover:text-brand" />
        </button>
      ))}
    </div>
  );
}

export function RecentApplications({
  applications,
  onView,
}: {
  applications: AdoptionApplication[];
  onView: (id: number) => void;
}) {
  if (applications.length === 0) {
    return <p className="py-10 text-center text-xs text-muted">No applications submitted yet.</p>;
  }
  return (
    <div className="divide-y divide-line">
      {applications.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => onView(item.id)}
          className="group flex w-full items-center gap-3 py-2.5 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-[11px] font-bold text-brand">
            #{item.id}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink">
              {item.animalName} · {item.adopterName}
            </span>
            <span className="block truncate text-[11px] text-muted">
              Applied {formatDate(item.date)} · {item.adopterContact}
            </span>
          </span>
          <StatusBadge value={item.status} />
          <ArrowUpRight className="h-3.5 w-3.5 text-muted transition group-hover:text-brand" />
        </button>
      ))}
    </div>
  );
}

export function OperationalAlerts({
  applications,
  health,
  animals,
  onApplication,
  onVaccination,
  onAnimal,
}: {
  applications: AdoptionApplication[];
  health: MedicalRecord[];
  animals: Animal[];
  onApplication: (id: number) => void;
  onVaccination: () => void;
  onAnimal: (id: number) => void;
}) {
  const pending = applications.filter(item => item.status === 'PENDING');
  const due = health
    .filter(item => item.vaccinationStatus !== 'VACCINATED' && daysUntil(item.nextVaccinationDate) <= 30)
    .sort((a, b) => daysUntil(a.nextVaccinationDate) - daysUntil(b.nextVaccinationDate));
  const treatment = animals.filter(item => item.healthStatus.toLowerCase().includes('treatment'));

  const rows = [
    {
      key: 'pending',
      icon: <ClipboardList className="h-4 w-4 text-warning" />,
      label: `${pending.length} pending application${pending.length === 1 ? '' : 's'}`,
      detail: 'Awaiting manager review',
      action: pending[0] ? () => onApplication(pending[0].id) : undefined,
    },
    {
      key: 'vaccination',
      icon: <CalendarClock className="h-4 w-4 text-info" />,
      label: `${due.length} vaccination reminder${due.length === 1 ? '' : 's'}`,
      detail: due[0] ? `${due[0].animalName} · ${dueLabel(due[0])}` : 'No reminders in the next 30 days',
      action: due.length ? onVaccination : undefined,
    },
    {
      key: 'treatment',
      icon: <Stethoscope className="h-4 w-4 text-danger" />,
      label: `${treatment.length} animal${treatment.length === 1 ? '' : 's'} under treatment`,
      detail: treatment[0]?.healthStatus ?? 'All animals are healthy',
      action: treatment[0] ? () => onAnimal(treatment[0].id) : undefined,
    },
  ];

  return (
    <div className="space-y-2">
      {rows.map(row => (
        <button
          key={row.key}
          type="button"
          disabled={!row.action}
          onClick={row.action}
          className="flex w-full items-center gap-3 rounded-lg border border-line bg-subtle/50 px-3 py-2.5 text-left transition enabled:hover:border-brand/30 disabled:opacity-70"
        >
          {row.icon}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-medium text-ink">{row.label}</span>
            <span className="block truncate text-[11px] text-muted">{row.detail}</span>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted" />
        </button>
      ))}
      {rows.every(row => !row.action) ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-3 text-xs text-success">
          <HeartHandshake className="h-4 w-4" /> No actionable alerts right now.
        </div>
      ) : null}
    </div>
  );
}

export function StaffMiniCard({ role, count, icon }: { role: string; count: number; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-subtle/50 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted">{role}</p>
        <p className="num text-base font-semibold text-ink">{count}</p>
      </div>
      <Users className="h-3.5 w-3.5 text-muted" />
    </div>
  );
}
