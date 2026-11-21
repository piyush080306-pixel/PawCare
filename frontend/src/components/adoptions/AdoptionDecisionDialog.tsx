import { PawPrint, UserRound } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useApproveAdoption, useRejectAdoption } from '@/services/api/queries';
import type { AdoptionApplication } from '@/types/shelter';
import { formatDate } from '@/utils/format';

interface Props {
  application: AdoptionApplication | null;
  decision: 'approve' | 'reject' | null;
  onOpenChange: (open: boolean) => void;
}

export function AdoptionDecisionDialog({ application, decision, onOpenChange }: Props) {
  const approve = useApproveAdoption();
  const reject = useRejectAdoption();
  const isApprove = decision === 'approve';
  const busy = approve.isPending || reject.isPending;

  const confirm = async () => {
    if (!application || !decision) return;
    try {
      if (decision === 'approve') await approve.mutateAsync(application.id);
      else await reject.mutateAsync(application.id);
      onOpenChange(false);
    } catch {
      // handled by mutation hook
    }
  };

  return (
    <ConfirmDialog
      open={Boolean(application && decision)}
      onOpenChange={onOpenChange}
      title={isApprove ? 'Approve this application?' : 'Reject this application?'}
      description={
        isApprove
          ? 'The Scala backend will mark the animal as adopted in the same transaction. This cannot be undone from the UI.'
          : 'The application will be marked rejected. The animal remains available.'
      }
      confirmLabel={isApprove ? 'Approve application' : 'Reject application'}
      tone={isApprove ? 'primary' : 'danger'}
      loading={busy}
      onConfirm={() => void confirm()}
    >
      {application ? (
        <div className="space-y-2 rounded-lg border border-line bg-subtle/60 p-3 text-xs">
          <div className="flex items-center gap-2">
            <PawPrint className="h-3.5 w-3.5 text-brand" />
            <span className="text-muted">Animal</span>
            <span className="ml-auto font-semibold text-ink">
              #{application.animalId} · {application.animalName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="h-3.5 w-3.5 text-brand" />
            <span className="text-muted">Adopter</span>
            <span className="ml-auto font-semibold text-ink">
              {application.adopterName} ({application.adopterAge})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted">Applied on</span>
            <span className="ml-auto font-semibold text-ink">{formatDate(application.date)}</span>
          </div>
          <p className="pt-1 text-[11px] leading-relaxed text-muted">
            The backend response will be shown as a notification and all related views will refresh.
          </p>
        </div>
      ) : null}
    </ConfirmDialog>
  );
}
