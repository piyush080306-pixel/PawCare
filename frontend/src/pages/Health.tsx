import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  ClipboardPlus,
  HeartPulse,
  Pencil,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Drawer } from '@/components/ui/Drawer';
import { ErrorState } from '@/components/ui/Feedback';
import { HealthFormModal } from '@/components/health/HealthFormModal';
import { VaccinationModal } from '@/components/health/VaccinationModal';
import { useAnimals, useHealth, useStaff } from '@/services/api/queries';
import type { MedicalRecord } from '@/types/shelter';
import { useDebounce } from '@/hooks/useDebounce';
import { daysUntil, dueLabel, formatDate } from '@/utils/format';

type Window = 'ALL' | '7' | '30' | 'OVERDUE';

export default function Health() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: records = [], isLoading, isError, error, refetch } = useHealth();
  const { data: staff = [] } = useStaff();
  const { data: animals = [] } = useAnimals();
  const vets = staff.filter(member => member.role === 'VETERINARIAN');

  const [tab, setTab] = useState('records');
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [vetFilter, setVetFilter] = useState('ALL');
  const [windowFilter, setWindowFilter] = useState<Window>('ALL');
  const [animalFilter, setAnimalFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [vaccinationRecord, setVaccinationRecord] = useState<MedicalRecord | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get('view') === 'vaccinations') setTab('vaccinations');
    const animalParam = searchParams.get('animal');
    if (animalParam) setAnimalFilter(animalParam);
    const recordParam = Number(searchParams.get('record'));
    if (recordParam) setSelectedId(recordParam);
  }, [searchParams]);

  const filtered = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    return records.filter(record => {
      if (needle && !`${record.id} ${record.animalName} ${record.condition}`.toLowerCase().includes(needle)) return false;
      if (vetFilter !== 'ALL' && String(record.vetId ?? '') !== vetFilter) return false;
      if (animalFilter !== 'ALL' && String(record.animalId) !== animalFilter) return false;
      if (windowFilter === 'OVERDUE') {
        return daysUntil(record.nextVaccinationDate) < 0 && record.vaccinationStatus !== 'VACCINATED';
      }
      if (windowFilter === '7' || windowFilter === '30') {
        const days = daysUntil(record.nextVaccinationDate);
        const limit = windowFilter === '7' ? 7 : 30;
        return days >= 0 && days <= limit && record.vaccinationStatus !== 'VACCINATED';
      }
      return true;
    });
  }, [animalFilter, debounced, records, vetFilter, windowFilter]);

  const overdue = records.filter(
    record => daysUntil(record.nextVaccinationDate) < 0 && record.vaccinationStatus !== 'VACCINATED',
  );
  const soon = records.filter(record => {
    const days = daysUntil(record.nextVaccinationDate);
    return days >= 0 && days <= 7 && record.vaccinationStatus !== 'VACCINATED';
  });
  const upToDate = records.filter(record => record.vaccinationStatus === 'VACCINATED');
  const healthy = animals.filter(animal => animal.healthStatus.toLowerCase() === 'healthy').length;
  const treatment = animals.filter(animal => animal.healthStatus.toLowerCase().includes('treatment')).length;
  const selected = records.find(record => record.id === selectedId) ?? null;

  const columns: Column<MedicalRecord>[] = [
    { key: 'id', header: 'Record', cell: row => <span className="num font-medium">#{row.id}</span> },
    { key: 'animal', header: 'Animal', cell: row => <span className="font-medium">{row.animalName}</span> },
    { key: 'condition', header: 'Condition', cell: row => row.condition },
    { key: 'status', header: 'Vaccination', cell: row => <StatusBadge value={row.vaccinationStatus} /> },
    { key: 'vet', header: 'Veterinarian', cell: row => (row.vetName ? `Dr. ${row.vetName}` : <span className="text-muted">Unassigned</span>) },
    { key: 'last', header: 'Last checkup', cell: row => <span className="text-muted">{formatDate(row.lastCheckupDate)}</span> },
    { key: 'next', header: 'Next vaccination', cell: row => <span className={`${daysUntil(row.nextVaccinationDate) < 0 ? 'text-danger' : 'text-muted'}`}>{formatDate(row.nextVaccinationDate)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      cell: row => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setSelectedId(row.id)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => setVaccinationRecord(row)} aria-label={`Update vaccination for ${row.animalName}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load health records.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Animal health management"
        description="Veterinary records, vaccination status and follow-up scheduling."
        actions={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <ClipboardPlus className="h-4 w-4" /> Log medical record
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Medical records', value: records.length, icon: <ClipboardPlus className="h-4 w-4" /> },
          { label: 'Healthy animals', value: healthy, icon: <ShieldCheck className="h-4 w-4" /> },
          { label: 'Under treatment', value: treatment, icon: <Stethoscope className="h-4 w-4" /> },
          { label: 'Vaccination reminders', value: overdue.length + soon.length, icon: <CalendarClock className="h-4 w-4" /> },
        ].map(card => (
          <div key={card.label} className="panel flex items-center gap-3 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
              {card.icon}
            </span>
            <div>
              <p className="text-[11px] text-muted">{card.label}</p>
              <p className="num font-display text-xl font-semibold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Panel padded={false}>
        <Tabs value={tab} onValueChange={setTab} className="p-4">
          <TabsList>
            <TabsTrigger value="records" count={records.length}>Medical records</TabsTrigger>
            <TabsTrigger value="vaccinations" count={overdue.length + soon.length}>Vaccination monitor</TabsTrigger>
          </TabsList>

          <TabsContent value="records">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <SearchInput value={query} onChange={setQuery} placeholder="Search record, animal or condition…" className="lg:w-72" />
              <Select value={vetFilter} onChange={event => setVetFilter(event.target.value)} className="w-44">
                <option value="ALL">All veterinarians</option>
                {vets.map(vet => (
                  <option key={vet.id} value={vet.id}>Dr. {vet.name}</option>
                ))}
              </Select>
              <Select value={windowFilter} onChange={event => setWindowFilter(event.target.value as Window)} className="w-44">
                <option value="ALL">All due dates</option>
                <option value="7">Next 7 days</option>
                <option value="30">Next 30 days</option>
                <option value="OVERDUE">Overdue</option>
              </Select>
              <Select value={animalFilter} onChange={event => setAnimalFilter(event.target.value)} className="w-44">
                <option value="ALL">All animals</option>
                {animals.map(animal => (
                  <option key={animal.id} value={animal.id}>{animal.name}</option>
                ))}
              </Select>
            </div>
            <div className="rounded-lg border border-line">
              <DataTable
                rows={filtered}
                columns={columns}
                rowKey={row => row.id}
                loading={isLoading}
                onRowClick={row => setSelectedId(row.id)}
                emptyTitle="No records match these filters"
                emptyDescription="Log a medical record or adjust the filters."
              />
            </div>
          </TabsContent>

          <TabsContent value="vaccinations">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: 'Overdue', rows: overdue, tone: 'text-danger', empty: 'No overdue vaccinations.' },
                { title: 'Due soon', rows: soon, tone: 'text-warning', empty: 'Nothing due in the next 7 days.' },
                { title: 'Up to date', rows: upToDate, tone: 'text-success', empty: 'No completed vaccinations.' },
              ].map(section => (
                <div key={section.title} className="rounded-lg border border-line bg-subtle/40">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <p className={`text-xs font-semibold uppercase tracking-wider ${section.tone}`}>
                      {section.title}
                    </p>
                    <span className="num text-xs text-muted">{section.rows.length}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    {section.rows.length === 0 ? (
                      <p className="py-6 text-center text-[11px] text-muted">{section.empty}</p>
                    ) : (
                      section.rows.map(record => (
                        <button
                          key={record.id}
                          type="button"
                          onClick={() => setSelectedId(record.id)}
                          className="w-full rounded-lg border border-line bg-surface p-3 text-left transition hover:border-brand/30"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-medium text-ink">
                              {record.animalName}
                            </span>
                            <StatusBadge value={record.vaccinationStatus} />
                          </div>
                          <p className="mt-1 truncate text-[11px] text-muted">{record.condition}</p>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                            <span>{formatDate(record.nextVaccinationDate)}</span>
                            <span className={section.tone}>{dueLabel(record)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Panel>

      <HealthFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        preselectedAnimalId={Number(searchParams.get('logAnimal')) || null}
      />
      <VaccinationModal
        open={Boolean(vaccinationRecord)}
        onOpenChange={open => !open && setVaccinationRecord(null)}
        record={vaccinationRecord}
      />

      <Drawer
        open={Boolean(selected)}
        onOpenChange={open => {
          if (!open) {
            setSelectedId(null);
            const next = new URLSearchParams(searchParams);
            next.delete('record');
            setSearchParams(next, { replace: true });
          }
        }}
        title={selected ? `${selected.animalName} · ${selected.condition}` : 'Medical record'}
        eyebrow={selected ? `Record #${selected.id}` : undefined}
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => setVaccinationRecord(selected)}>
                <HeartPulse className="h-3.5 w-3.5" /> Update vaccination
              </Button>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/animals/${selected.animalId}`)}>
                View animal
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Animal', selected.animalName],
                ['Condition', selected.condition],
                ['Vaccination', selected.vaccinationStatus],
                ['Veterinarian', selected.vetName ? `Dr. ${selected.vetName}` : 'Unassigned'],
                ['Last checkup', formatDate(selected.lastCheckupDate)],
                ['Next vaccination', formatDate(selected.nextVaccinationDate)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-subtle/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-line bg-subtle/50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Treatment details</p>
              <p className="mt-2 leading-relaxed text-ink">{selected.treatment}</p>
            </div>
            <div className="rounded-lg border border-dashed border-line p-4 text-muted">
              Due status: <span className="font-semibold text-ink">{dueLabel(selected)}</span>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
