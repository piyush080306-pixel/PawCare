import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  Grid2X2,
  Heart,
  List,
  Pencil,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Form';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState } from '@/components/ui/Feedback';
import { AnimalFormModal } from '@/components/animals/AnimalFormModal';
import {
  useAdoptions,
  useAnimals,
  useDeleteAnimal,
  useHealthForAnimal,
} from '@/services/api/queries';
import type { Animal, Species } from '@/types/shelter';
import { useDebounce } from '@/hooks/useDebounce';
import { animalPhoto } from '@/utils/images';
import { animalSubtitle, formatDate, speciesLabel } from '@/utils/format';

type StatusFilter = 'ALL' | 'AVAILABLE' | 'ADOPTED' | 'TREATMENT';
type SortKey = 'id' | 'name' | 'age-desc' | 'age-asc';

export default function Animals() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: animals = [], isLoading, isError, error, refetch } = useAnimals();
  const { data: adoptions = [] } = useAdoptions();
  const remove = useDeleteAnimal();

  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 220);
  const [species, setSpecies] = useState<Species | 'ALL'>('ALL');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [gender, setGender] = useState('ALL');
  const [ageBand, setAgeBand] = useState('ALL');
  const [sort, setSort] = useState<SortKey>('id');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Animal | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);

  useEffect(() => {
    const speciesParam = searchParams.get('species');
    if (speciesParam === 'DOG' || speciesParam === 'CAT' || speciesParam === 'BIRD') {
      setSpecies(speciesParam);
    }
    const animalParam = Number(searchParams.get('animal'));
    if (animalParam) setSelectedId(animalParam);
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
    }
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const closeForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) updateParam('new', null);
  };

  const filtered = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    const rows = animals.filter(animal => {
      if (needle && !`${animal.name} ${animal.id}`.toLowerCase().includes(needle)) return false;
      if (species !== 'ALL' && animal.category !== species) return false;
      if (status === 'AVAILABLE' && animal.isAdopted) return false;
      if (status === 'ADOPTED' && !animal.isAdopted) return false;
      if (status === 'TREATMENT' && !animal.healthStatus.toLowerCase().includes('treatment')) return false;
      if (gender !== 'ALL' && !animal.gender.toLowerCase().includes(gender.toLowerCase())) return false;
      if (ageBand === 'young' && animal.age >= 2) return false;
      if (ageBand === 'adult' && (animal.age < 2 || animal.age > 6)) return false;
      if (ageBand === 'senior' && animal.age <= 6) return false;
      return true;
    });
    return rows.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'age-desc') return b.age - a.age;
      if (sort === 'age-asc') return a.age - b.age;
      return a.id - b.id;
    });
  }, [ageBand, animals, debounced, gender, sort, species, status]);

  const selected = animals.find(animal => animal.id === selectedId) ?? null;
  const { data: selectedHealth = [] } = useHealthForAnimal(selectedId ?? undefined);
  const selectedAdoption = [...adoptions]
    .filter(item => item.animalId === selectedId)
    .sort((a, b) => b.id - a.id)[0];

  const available = animals.filter(animal => !animal.isAdopted).length;
  const adopted = animals.length - available;
  const treatment = animals.filter(animal => animal.healthStatus.toLowerCase().includes('treatment')).length;

  const openEdit = (animal: Animal) => {
    setEditing(animal);
    setFormOpen(true);
  };

  const columns: Column<Animal>[] = [
    {
      key: 'animal',
      header: 'Animal',
      cell: row => (
        <div className="flex items-center gap-3">
          <img src={animalPhoto(row)} alt="" className="h-9 w-9 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{row.name}</p>
            <p className="text-[11px] text-muted">#{row.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', cell: row => <StatusBadge value={row.category} label={speciesLabel(row.category)} /> },
    { key: 'breed', header: 'Breed / species', cell: row => <span className="text-muted">{animalSubtitle(row)}</span> },
    { key: 'age', header: 'Age', cell: row => <span className="num">{row.age} yrs</span> },
    { key: 'gender', header: 'Gender', cell: row => row.gender },
    { key: 'health', header: 'Health', cell: row => <StatusBadge value={row.healthStatus} label={row.healthStatus} /> },
    {
      key: 'adoption',
      header: 'Adoption',
      cell: row => (
        <StatusBadge
          value={row.isAdopted ? 'ADOPTED' : 'AVAILABLE'}
          label={row.isAdopted ? 'Adopted' : 'Available'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: row => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setSelectedId(row.id)}>
            View
          </Button>
          <Button size="sm" variant="ghost" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load animals.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Animal management"
        description="Manage registered animals, monitor availability, and maintain shelter records."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Register animal
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total animals', value: animals.length, icon: <Plus className="h-4 w-4" />, tone: 'text-brand' },
          { label: 'Available', value: available, icon: <Heart className="h-4 w-4" />, tone: 'text-success' },
          { label: 'Adopted', value: adopted, icon: <ShieldCheck className="h-4 w-4" />, tone: 'text-info' },
          { label: 'Under medical care', value: treatment, icon: <Stethoscope className="h-4 w-4" />, tone: 'text-warning' },
        ].map(card => (
          <div key={card.label} className="panel flex items-center gap-3 p-4">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-subtle ${card.tone}`}>
              {card.icon}
            </span>
            <div>
              <p className="text-[11px] text-muted">{card.label}</p>
              <p className="num font-display text-xl font-semibold text-ink">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by name or ID…"
            className="lg:w-64"
          />
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {(['ALL', 'DOG', 'CAT', 'BIRD'] as const).map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSpecies(value)}
                  className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition ${
                    species === value
                      ? 'bg-brand text-white dark:text-[#121812]'
                      : 'bg-subtle text-muted hover:text-ink'
                  }`}
                >
                  {value === 'ALL' ? 'All species' : speciesLabel(value)}
                </button>
              ))}
            </div>
            <Select value={status} onChange={event => setStatus(event.target.value as StatusFilter)} className="w-36">
              <option value="ALL">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ADOPTED">Adopted</option>
              <option value="TREATMENT">Under treatment</option>
            </Select>
            <Select value={gender} onChange={event => setGender(event.target.value)} className="w-28">
              <option value="ALL">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </Select>
            <Select value={ageBand} onChange={event => setAgeBand(event.target.value)} className="w-32">
              <option value="ALL">All ages</option>
              <option value="young">Under 2 years</option>
              <option value="adult">2–6 years</option>
              <option value="senior">7+ years</option>
            </Select>
            <Select value={sort} onChange={event => setSort(event.target.value as SortKey)} className="w-36">
              <option value="id">Sort: newest ID</option>
              <option value="name">Sort: name A–Z</option>
              <option value="age-desc">Sort: oldest first</option>
              <option value="age-asc">Sort: youngest first</option>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-line bg-subtle p-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                view === 'grid' ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-ink'
              }`}
              aria-label="Grid view"
            >
              <Grid2X2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                view === 'table' ? 'bg-surface text-brand shadow-sm' : 'text-muted hover:text-ink'
              }`}
              aria-label="Table view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-64 animate-pulse rounded-lg bg-subtle" />
            ))}
          </div>
        ) : view === 'table' ? (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={row => row.id}
            onRowClick={row => setSelectedId(row.id)}
            emptyTitle="No animals match these filters"
            emptyDescription="Try clearing a filter or register a new animal."
          />
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.length === 0 ? (
              <p className="col-span-full py-12 text-center text-xs text-muted">
                No animals match these filters.
              </p>
            ) : (
              filtered.map(animal => (
                <article key={animal.id} className="panel overflow-hidden transition hover:border-brand/30">
                  <div className="relative h-36 overflow-hidden bg-subtle">
                    <img
                      src={animalPhoto(animal)}
                      alt={animal.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 hover:scale-105"
                    />
                    <div className="absolute left-3 top-3">
                      <StatusBadge
                        value={animal.isAdopted ? 'ADOPTED' : 'AVAILABLE'}
                        label={animal.isAdopted ? 'Adopted' : 'Available'}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-sm font-semibold text-ink">
                          {animal.name}
                        </h3>
                        <p className="truncate text-[11px] text-muted">
                          #{animal.id} · {animalSubtitle(animal)}
                        </p>
                      </div>
                      <StatusBadge value={animal.category} label={speciesLabel(animal.category)} />
                    </div>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {animal.age}y</span>
                      <span className="flex items-center gap-1"><UserRound className="h-3 w-3" /> {animal.gender}</span>
                    </div>
                    <div className="mt-3">
                      <StatusBadge value={animal.healthStatus} label={animal.healthStatus} />
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedId(animal.id)}>
                        View profile <ArrowUpRight className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(animal)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto text-danger"
                        onClick={() => setDeleteTarget(animal)}
                        aria-label={`Delete ${animal.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </Panel>

      <AnimalFormModal open={formOpen} onOpenChange={closeForm} animal={editing} />

      <Drawer
        open={Boolean(selected)}
        onOpenChange={open => {
          if (!open) {
            setSelectedId(null);
            updateParam('animal', null);
          }
        }}
        title={selected?.name ?? 'Animal profile'}
        eyebrow={selected ? `Animal #${selected.id} · ${speciesLabel(selected.category)}` : undefined}
        footer={
          selected ? (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" onClick={() => navigate(`/animals/${selected.id}`)}>
                Full profile
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openEdit(selected)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/adoptions?new=1&animal=${selected.id}`)}
                disabled={selected.isAdopted}
              >
                <Heart className="h-3.5 w-3.5" /> Start adoption
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="ml-auto"
                onClick={() => setDeleteTarget(selected)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-6">
            <img
              src={animalPhoto(selected)}
              alt={selected.name}
              className="h-48 w-full rounded-lg object-cover"
            />
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Animal ID', `#${selected.id}`],
                ['Type', speciesLabel(selected.category)],
                ['Breed / species', animalSubtitle(selected)],
                ['Age', `${selected.age} years`],
                ['Gender', selected.gender],
                ['Health status', selected.healthStatus],
                ['Adoption', selected.isAdopted ? 'Adopted' : 'Available'],
                ['Details', selected.detail ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-subtle/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 break-words font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Adoption status
              </h3>
              {selectedAdoption ? (
                <div className="rounded-lg border border-line bg-subtle/50 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink">
                      #{selectedAdoption.id} · {selectedAdoption.adopterName}
                    </span>
                    <StatusBadge value={selectedAdoption.status} />
                  </div>
                  <p className="mt-1 text-muted">
                    Applied {formatDate(selectedAdoption.date)} · {selectedAdoption.adopterContact}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted">No adoption applications for this animal.</p>
              )}
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Medical history
              </h3>
              {selectedHealth.length === 0 ? (
                <p className="text-xs text-muted">No medical records logged.</p>
              ) : (
                <div className="space-y-2">
                  {selectedHealth.map(record => (
                    <div key={record.id} className="rounded-lg border border-line bg-subtle/50 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink">{record.condition}</span>
                        <StatusBadge value={record.vaccinationStatus} />
                      </div>
                      <p className="mt-1 text-muted">{record.treatment}</p>
                      <p className="mt-1 text-[11px] text-muted">
                        Last checkup {formatDate(record.lastCheckupDate)} · Next {formatDate(record.nextVaccinationDate)}
                        {record.vetName ? ` · Dr. ${record.vetName}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/health?animal=${selected.id}`)}
            >
              <Stethoscope className="h-3.5 w-3.5" /> Open health records
            </Button>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name ?? 'animal'}?`}
        description="The backend rejects deletion when linked adoption or medical records exist. This action cannot be undone."
        confirmLabel="Delete animal"
        tone="danger"
        loading={remove.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          remove.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteTarget(null);
              setSelectedId(null);
            },
          });
        }}
      />
    </div>
  );
}
