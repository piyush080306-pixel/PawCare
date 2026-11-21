import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BriefcaseBusiness,
  Pencil,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Users,
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
import { StaffFormModal } from '@/components/staff/StaffFormModal';
import { useDeleteStaff, useHealth, useStaff } from '@/services/api/queries';
import type { StaffMember } from '@/types/shelter';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency, initials, roleLabel } from '@/utils/format';

export default function Staff() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: staff = [], isLoading, isError, error, refetch } = useStaff();
  const { data: health = [] } = useHealth();
  const remove = useDeleteStaff();

  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [role, setRole] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);

  useEffect(() => {
    const memberId = Number(searchParams.get('member'));
    if (memberId) setSelectedId(memberId);
  }, [searchParams]);

  const rows = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    return staff
      .filter(member => {
        if (needle && !`${member.name} ${member.id} ${member.contactNumber}`.toLowerCase().includes(needle)) return false;
        if (role !== 'ALL' && member.role !== role) return false;
        return true;
      })
      .sort((a, b) => a.id - b.id);
  }, [debounced, role, staff]);

  const counts = {
    total: staff.length,
    managers: staff.filter(member => member.role === 'MANAGER').length,
    vets: staff.filter(member => member.role === 'VETERINARIAN').length,
    caretakers: staff.filter(member => member.role === 'CARETAKER').length,
  };

  const selected = staff.find(member => member.id === selectedId) ?? null;
  const activeCases = selected
    ? health.filter(record => record.vetId === selected.id && record.vaccinationStatus !== 'VACCINATED').length
    : 0;
  const totalCases = selected
    ? health.filter(record => record.vetId === selected.id).length
    : 0;

  const columns: Column<StaffMember>[] = [
    {
      key: 'member',
      header: 'Employee',
      cell: row => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">
            {initials(row.name)}
          </span>
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-[11px] text-muted">#{row.id}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', cell: row => <StatusBadge value={row.role} label={roleLabel(row.role)} /> },
    { key: 'contact', header: 'Contact', cell: row => <span className="num">{row.contactNumber}</span> },
    { key: 'age', header: 'Age', cell: row => <span className="num">{row.age}</span> },
    { key: 'salary', header: 'Salary', cell: row => <span className="num">{formatCurrency(row.salary)}</span> },
    {
      key: 'workload',
      header: 'Open cases',
      cell: row =>
        row.role === 'VETERINARIAN' ? (
          <span className="num text-info">
            {health.filter(record => record.vetId === row.id && record.vaccinationStatus !== 'VACCINATED').length}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      cell: row => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setSelectedId(row.id)}>View</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(row); setFormOpen(true); }} aria-label={`Edit ${row.name}`}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load staff.'}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Staff management"
        description="Manage the shelter roster, contact details and veterinary caseloads."
        actions={
          <Button
            variant="primary"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Onboard staff
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total staff', value: counts.total, icon: <Users className="h-4 w-4" /> },
          { label: 'Managers', value: counts.managers, icon: <ShieldCheck className="h-4 w-4" /> },
          { label: 'Veterinarians', value: counts.vets, icon: <Stethoscope className="h-4 w-4" /> },
          { label: 'Caretakers', value: counts.caretakers, icon: <BriefcaseBusiness className="h-4 w-4" /> },
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
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search name, ID or contact…" className="sm:w-72" />
          <Select value={role} onChange={event => setRole(event.target.value)} className="sm:w-48">
            <option value="ALL">All roles</option>
            <option value="MANAGER">Manager</option>
            <option value="VETERINARIAN">Veterinarian</option>
            <option value="CARETAKER">Caretaker</option>
          </Select>
          <p className="num ml-auto text-xs text-muted">{rows.length} of {staff.length} members</p>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={row => row.id}
          loading={isLoading}
          onRowClick={row => setSelectedId(row.id)}
          emptyTitle="No staff members found"
          emptyDescription="Try a different search or onboard a new team member."
        />
      </Panel>

      <StaffFormModal open={formOpen} onOpenChange={setFormOpen} member={editing} />

      <Drawer
        open={Boolean(selected)}
        onOpenChange={open => {
          if (!open) {
            setSelectedId(null);
            const next = new URLSearchParams(searchParams);
            next.delete('member');
            setSearchParams(next, { replace: true });
          }
        }}
        title={selected?.name ?? 'Staff details'}
        eyebrow={selected ? `Employee #${selected.id}` : undefined}
        footer={
          selected ? (
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => { setEditing(selected); setFormOpen(true); }}>
                <Pencil className="h-3.5 w-3.5" /> Edit record
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="ml-auto"
                onClick={() => setDeleteTarget(selected)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-lg border border-line bg-subtle/50 p-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-base font-bold text-brand">
                {initials(selected.name)}
              </span>
              <div>
                <p className="font-display text-base font-semibold text-ink">{selected.name}</p>
                <StatusBadge value={selected.role} label={roleLabel(selected.role)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                ['Staff ID', `#${selected.id}`],
                ['Contact', selected.contactNumber],
                ['Age', `${selected.age} years`],
                ['Salary', formatCurrency(selected.salary)],
                ['Detail', selected.detail ?? '—'],
                ['Role-specific', selected.specialization ?? selected.department ?? selected.assignedArea ?? '—'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-line bg-subtle/50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted">{label}</p>
                  <p className="mt-1 break-words font-medium text-ink">{value}</p>
                </div>
              ))}
            </div>
            {selected.role === 'VETERINARIAN' ? (
              <div className="rounded-lg border border-info/20 bg-info/5 p-4">
                <p className="text-xs font-semibold text-ink">Veterinary caseload</p>
                <div className="mt-2 flex gap-6 text-xs">
                  <span className="text-muted">
                    Active cases <strong className="num ml-1 text-ink">{activeCases}</strong>
                  </span>
                  <span className="text-muted">
                    Total records <strong className="num ml-1 text-ink">{totalCases}</strong>
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted">
                Caseload metrics apply to veterinarians only.
              </p>
            )}
            {selected.role === 'CARETAKER' ? (
              <p className="text-xs text-muted">
                Animal assignments are not stored per caretaker in the current backend schema.
              </p>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={open => !open && setDeleteTarget(null)}
        title={`Remove ${deleteTarget?.name ?? 'staff member'}?`}
        description="The backend will reject removal if this veterinarian has assigned medical records."
        tone="danger"
        confirmLabel="Remove member"
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
