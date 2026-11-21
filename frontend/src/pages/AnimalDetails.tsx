import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  Pencil,
  ShieldCheck,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { AnimalFormModal } from '@/components/animals/AnimalFormModal';
import {
  useAdoptions,
  useAnimal,
  useDeleteAnimal,
  useHealthForAnimal,
} from '@/services/api/queries';
import { animalPhoto } from '@/utils/images';
import { animalSubtitle, formatDate, speciesLabel } from '@/utils/format';

export default function AnimalDetails() {
  const { id } = useParams();
  const animalId = Number(id);
  const navigate = useNavigate();
  const { data: animal, isLoading, isError, error, refetch } = useAnimal(animalId);
  const { data: health = [] } = useHealthForAnimal(animalId);
  const { data: adoptions = [] } = useAdoptions();
  const remove = useDeleteAnimal();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load this animal.'}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading || !animal) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const history = adoptions.filter(item => item.animalId === animal.id);

  return (
    <div className="space-y-5 animate-slide-up">
      <Button variant="ghost" size="sm" onClick={() => navigate('/animals')}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to animals
      </Button>

      <PageHeader
        title={animal.name}
        description={`Animal #${animal.id} · ${animalSubtitle(animal)} · ${speciesLabel(animal.category)}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit animal
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/health?animal=${animal.id}`)}
            >
              <Stethoscope className="h-4 w-4" /> Medical history
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/adoptions?new=1&animal=${animal.id}`)}
              disabled={animal.isAdopted}
            >
              <Heart className="h-4 w-4" /> Start adoption
            </Button>
            <Button variant="danger" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete animal">
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        }
        meta={
          <>
            <StatusBadge
              value={animal.isAdopted ? 'ADOPTED' : 'AVAILABLE'}
              label={animal.isAdopted ? 'Adopted' : 'Available'}
            />
            <StatusBadge value={animal.healthStatus} label={animal.healthStatus} />
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Panel title="Profile overview" padded={false}>
            <img
              src={animalPhoto(animal)}
              alt={animal.name}
              className="h-64 w-full object-cover"
            />
            <div className="p-5">
              <p className="text-xs leading-relaxed text-muted">
                {animal.detail ?? 'No additional description stored for this animal.'}
              </p>
            </div>
          </Panel>

          <Panel title="Animal information">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Animal ID', `#${animal.id}`],
                ['Category', speciesLabel(animal.category)],
                ['Breed / species', animalSubtitle(animal)],
                ['Age', `${animal.age} years`],
                ['Gender', animal.gender],
                ['Health status', animal.healthStatus],
                ['Adoption status', animal.isAdopted ? 'Adopted' : 'Available'],
                ['Type details', animal.detail ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-subtle/50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 text-[13px] font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Health information" subtitle="Records returned by the HealthService">
            {health.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">No medical records have been logged.</p>
            ) : (
              <div className="space-y-3">
                {health.map(record => (
                  <div key={record.id} className="rounded-lg border border-line bg-subtle/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-ink">
                        #{record.id} · {record.condition}
                      </p>
                      <StatusBadge value={record.vaccinationStatus} />
                    </div>
                    <p className="mt-2 text-xs text-muted">{record.treatment}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Last: {formatDate(record.lastCheckupDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Next: {formatDate(record.nextVaccinationDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3 w-3" /> {record.vetName ? `Dr. ${record.vetName}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel title="Adoption history">
            {history.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">No adoption applications yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/adoptions/${item.id}`)}
                    className="w-full rounded-lg border border-line bg-subtle/50 p-3 text-left transition hover:border-brand/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">#{item.id}</span>
                      <StatusBadge value={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {item.adopterName} · {item.adopterContact}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Applied {formatDate(item.date)}</p>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Assigned caretaker">
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-line bg-subtle/40 p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
              <p className="text-xs leading-relaxed text-muted">
                Caretaker-to-animal assignments are not stored in the current backend schema, so no
                assignment is shown here. Staff assignments are available for veterinarians on medical records.
              </p>
            </div>
          </Panel>
        </div>
      </div>

      <AnimalFormModal open={editOpen} onOpenChange={setEditOpen} animal={animal} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${animal.name}?`}
        description="The backend will reject this request if linked records exist."
        tone="danger"
        confirmLabel="Delete animal"
        loading={remove.isPending}
        onConfirm={() => {
          remove.mutate(animal.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              navigate('/animals');
            },
          });
        }}
      />
    </div>
  );
}
