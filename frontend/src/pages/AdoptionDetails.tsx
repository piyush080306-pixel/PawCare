import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  HeartHandshake,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState, Skeleton } from '@/components/ui/Feedback';
import { AdoptionDecisionDialog } from '@/components/adoptions/AdoptionDecisionDialog';
import { useAdoption, useAnimal } from '@/services/api/queries';
import type { AdoptionApplication } from '@/types/shelter';
import { animalPhoto } from '@/utils/images';
import { animalSubtitle, formatDate, speciesLabel } from '@/utils/format';

export default function AdoptionDetails() {
  const { id } = useParams();
  const applicationId = Number(id);
  const navigate = useNavigate();
  const { data: application, isLoading, isError, error, refetch } = useAdoption(applicationId);
  const { data: animal } = useAnimal(application?.animalId);
  const [decision, setDecision] = useState<{
    application: AdoptionApplication;
    action: 'approve' | 'reject';
  } | null>(null);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load this application.'}
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading || !application) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <Button variant="ghost" size="sm" onClick={() => navigate('/adoptions')}>
        <ArrowLeft className="h-3.5 w-3.5" /> Back to applications
      </Button>

      <PageHeader
        title={`Application #${application.id}`}
        description={`Submitted ${formatDate(application.date)} for ${application.animalName}`}
        actions={
          application.status === 'PENDING' ? (
            <>
              <Button variant="secondary" onClick={() => setDecision({ application, action: 'reject' })}>
                <X className="h-4 w-4 text-danger" /> Reject
              </Button>
              <Button variant="primary" onClick={() => setDecision({ application, action: 'approve' })}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => navigate('/adoption-records')}>
              <HeartHandshake className="h-4 w-4" /> Adoption records
            </Button>
          )
        }
        meta={<StatusBadge value={application.status} />}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Applicant information" className="xl:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Application ID', value: `#${application.id}`, icon: <HeartHandshake className="h-3.5 w-3.5" /> },
              { label: 'Adopter name', value: application.adopterName, icon: <UserRound className="h-3.5 w-3.5" /> },
              { label: 'Adopter age', value: `${application.adopterAge} years`, icon: <UserRound className="h-3.5 w-3.5" /> },
              { label: 'Contact number', value: application.adopterContact, icon: <Phone className="h-3.5 w-3.5" /> },
              { label: 'Application date', value: formatDate(application.date), icon: <CalendarDays className="h-3.5 w-3.5" /> },
              { label: 'Current status', value: application.status, icon: <HeartHandshake className="h-3.5 w-3.5" /> },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-line bg-subtle/50 p-3">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {item.icon} {item.label}
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Animal details">
          {animal ? (
            <div>
              <img
                src={animalPhoto(animal)}
                alt={animal.name}
                className="h-36 w-full rounded-lg object-cover"
              />
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Name</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/animals/${animal.id}`)}
                    className="font-semibold text-brand hover:underline"
                  >
                    {animal.name} ↗
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Animal ID</span>
                  <span className="font-medium">#{animal.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Category</span>
                  <span className="font-medium">{speciesLabel(animal.category)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Details</span>
                  <span className="text-right font-medium">{animalSubtitle(animal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Health</span>
                  <StatusBadge value={animal.healthStatus} label={animal.healthStatus} />
                </div>
              </div>
            </div>
          ) : (
            <p className="py-10 text-center text-xs text-muted">Animal details unavailable.</p>
          )}
        </Panel>
      </div>

      <Panel title="Workflow note">
        <p className="text-xs leading-relaxed text-muted">
          Approval and rejection are executed by <code className="rounded bg-subtle px-1">AdoptionService</code>.
          On approval, the application status and the animal's adoption flag are updated in one
          SQLite transaction. The frontend never changes either value on its own.
        </p>
      </Panel>

      <AdoptionDecisionDialog
        application={decision?.application ?? null}
        decision={decision?.action ?? null}
        onOpenChange={open => !open && setDecision(null)}
      />
    </div>
  );
}
