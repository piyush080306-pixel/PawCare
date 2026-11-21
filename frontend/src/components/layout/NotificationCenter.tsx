import { AlertTriangle, Bell, CalendarClock, ClipboardList, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
} from '@/components/ui/Dropdown';
import { useAdoptions, useAnimals, useHealth } from '@/services/api/queries';
import { daysUntil } from '@/utils/format';

export function NotificationCenter() {
  const navigate = useNavigate();
  const { data: adoptions = [] } = useAdoptions();
  const { data: health = [] } = useHealth();
  const { data: animals = [] } = useAnimals();

  const pending = adoptions.filter(item => item.status === 'PENDING');
  const overdue = health.filter(item => daysUntil(item.nextVaccinationDate) < 0 && item.vaccinationStatus !== 'VACCINATED');
  const soon = health.filter(item => {
    const days = daysUntil(item.nextVaccinationDate);
    return days >= 0 && days <= 7 && item.vaccinationStatus !== 'VACCINATED';
  });
  const treatment = animals.filter(item => item.healthStatus.toLowerCase().includes('treatment'));
  const total = pending.length + overdue.length + soon.length;

  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-ink"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {total > 0 ? (
            <span className="num absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {total}
            </span>
          ) : null}
        </button>
      </DropdownTrigger>
      <DropdownContent className="max-h-[70vh] w-[min(360px,calc(100vw-2rem))] overflow-y-auto p-2">
        <div className="px-2 py-1.5">
          <p className="font-display text-sm font-semibold text-ink">Notifications</p>
          <p className="text-[11px] text-muted">Derived from live shelter records</p>
        </div>
        <DropdownSeparator />

        {total === 0 && treatment.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted">Everything is up to date.</p>
        ) : null}

        {pending.length > 0 ? (
          <>
            <DropdownLabel>Pending applications</DropdownLabel>
            {pending.slice(0, 3).map(item => (
              <DropdownItem key={item.id} onSelect={() => navigate(`/adoptions/${item.id}`)}>
                <ClipboardList className="h-3.5 w-3.5 text-warning" />
                <span className="truncate">#{item.id} · {item.adopterName} · {item.animalName}</span>
              </DropdownItem>
            ))}
            <DropdownSeparator />
          </>
        ) : null}

        {overdue.length > 0 ? (
          <>
            <DropdownLabel>Overdue vaccinations</DropdownLabel>
            {overdue.slice(0, 3).map(item => (
              <DropdownItem key={item.id} onSelect={() => navigate('/health?view=vaccinations')}>
                <AlertTriangle className="h-3.5 w-3.5 text-danger" />
                <span className="truncate">{item.animalName} · {item.condition}</span>
              </DropdownItem>
            ))}
            <DropdownSeparator />
          </>
        ) : null}

        {soon.length > 0 ? (
          <>
            <DropdownLabel>Due this week</DropdownLabel>
            {soon.slice(0, 3).map(item => (
              <DropdownItem key={item.id} onSelect={() => navigate('/health?view=vaccinations')}>
                <CalendarClock className="h-3.5 w-3.5 text-warning" />
                <span className="truncate">{item.animalName} · in {daysUntil(item.nextVaccinationDate)}d</span>
              </DropdownItem>
            ))}
            <DropdownSeparator />
          </>
        ) : null}

        {treatment.length > 0 ? (
          <>
            <DropdownLabel>Under medical care</DropdownLabel>
            {treatment.slice(0, 3).map(item => (
              <DropdownItem key={item.id} onSelect={() => navigate(`/animals/${item.id}`)}>
                <Stethoscope className="h-3.5 w-3.5 text-info" />
                <span className="truncate">{item.name} · {item.healthStatus}</span>
              </DropdownItem>
            ))}
          </>
        ) : null}
      </DropdownContent>
    </Dropdown>
  );
}
