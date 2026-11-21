import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, ClipboardList, Eye, Plus, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ErrorState } from '@/components/ui/Feedback';
import { AdoptionFormModal } from '@/components/adoptions/AdoptionFormModal';
import { AdoptionDecisionDialog } from '@/components/adoptions/AdoptionDecisionDialog';
import { useAdoptions } from '@/services/api/queries';
import type { AdoptionApplication, AdoptionStatus } from '@/types/shelter';
import { formatDate } from '@/utils/format';

export default function Adoptions() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: applications = [], isLoading, isError, error, refetch } = useAdoptions();
  const [tab, setTab] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [decision, setDecision] = useState<{
    application: AdoptionApplication;
    action: 'approve' | 'reject';
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') setFormOpen(true);
  }, [searchParams]);

  const closeForm = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      next.delete('animal');
      setSearchParams(next, { replace: true });
    }
  };

  const counts = {
    all: applications.length,
    pending: applications.filter(item => item.status === 'PENDING').length,
    approved: applications.filter(item => item.status === 'APPROVED').length,
    rejected: applications.filter(item => item.status === 'REJECTED').length,
  };

  const filtered = applications.filter(item => {
    if (tab === 'all') return true;
    return item.status.toLowerCase() === tab;
  });

  const columns: Column<AdoptionApplication>[] = [
    { key: 'id', header: 'ID', cell: row => <span className="num font-medium">#{row.id}</span> },
    {
      key: 'animal',
      header: 'Animal',
      cell: row => (
        <div>
          <p className="font-medium text-ink">{row.animalName}</p>
          <p className="text-[11px] text-muted">#{row.animalId}</p>
        </div>
      ),
    },
    { key: 'adopter', header: 'Adopter', cell: row => <span>{row.adopterName} <span className="text-muted">({row.adopterAge})</span></span> },
    { key: 'contact', header: 'Contact', cell: row => <span className="num text-muted">{row.adopterContact}</span> },
    { key: 'date', header: 'Applied', cell: row => <span className="text-muted">{formatDate(row.date)}</span> },
    { key: 'status', header: 'Status', cell: row => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cell: row => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => navigate(`/adoptions/${row.id}`)}>
            <Eye className="h-3.5 w-3.5" /> View
          </Button>
          {row.status === 'PENDING' ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="text-success"
                onClick={() => setDecision({ application: row, action: 'approve' })}
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-danger"
                onClick={() => setDecision({ application: row, action: 'reject' })}
              >
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </>
          ) : null}
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load applications.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Adoption applications"
        description="Review applications and process decisions through the Scala approval workflow."
        actions={
          <Button variant="primary" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> New application
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'All applications', value: counts.all, status: 'ALL' as const },
          { label: 'Pending review', value: counts.pending, status: 'PENDING' as AdoptionStatus },
          { label: 'Approved', value: counts.approved, status: 'APPROVED' as AdoptionStatus },
          { label: 'Rejected', value: counts.rejected, status: 'REJECTED' as AdoptionStatus },
        ].map(card => (
          <button
            key={card.label}
            type="button"
            onClick={() => setTab(card.status.toLowerCase())}
            className="panel p-4 text-left transition hover:border-brand/30"
          >
            <p className="text-[11px] text-muted">{card.label}</p>
            <p className="num mt-1 font-display text-xl font-semibold text-ink">{card.value}</p>
          </button>
        ))}
      </div>

      <Panel padded={false}>
        <Tabs value={tab} onValueChange={setTab} className="p-4">
          <TabsList>
            <TabsTrigger value="all" count={counts.all}>All applications</TabsTrigger>
            <TabsTrigger value="pending" count={counts.pending}>Pending</TabsTrigger>
            <TabsTrigger value="approved" count={counts.approved}>Approved</TabsTrigger>
            <TabsTrigger value="rejected" count={counts.rejected}>Rejected</TabsTrigger>
          </TabsList>
          {['all', 'pending', 'approved', 'rejected'].map(value => (
            <TabsContent key={value} value={value}>
              <div className="rounded-lg border border-line">
                <DataTable
                  rows={filtered}
                  columns={columns}
                  rowKey={row => row.id}
                  loading={isLoading}
                  onRowClick={row => navigate(`/adoptions/${row.id}`)}
                  emptyTitle={`No ${value === 'all' ? '' : value} applications`}
                  emptyDescription="Applications will appear here after they are submitted."
                  emptyAction={
                    <Button size="sm" variant="primary" onClick={() => setFormOpen(true)}>
                      <ClipboardList className="h-3.5 w-3.5" /> New application
                    </Button>
                  }
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Panel>

      <AdoptionFormModal
        open={formOpen}
        onOpenChange={closeForm}
        preselectedAnimalId={Number(searchParams.get('animal')) || null}
      />
      <AdoptionDecisionDialog
        application={decision?.application ?? null}
        decision={decision?.action ?? null}
        onOpenChange={open => !open && setDecision(null)}
      />
    </div>
  );
}
