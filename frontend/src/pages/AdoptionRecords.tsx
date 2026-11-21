import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, HeartHandshake, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select, Input } from '@/components/ui/Form';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ErrorState } from '@/components/ui/Feedback';
import { useAdoptions, useAnimals, useReports } from '@/services/api/queries';
import type { AdoptionApplication } from '@/types/shelter';
import { downloadCsv } from '@/utils/export';
import { formatDate, speciesLabel } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';

type SortKey = 'id-desc' | 'id-asc' | 'date-desc' | 'date-asc' | 'adopter';

export default function AdoptionRecords() {
  const navigate = useNavigate();
  const { data: adoptions = [], isLoading, isError, error, refetch } = useAdoptions();
  const { data: animals = [] } = useAnimals();
  const { data: reports } = useReports();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);
  const [category, setCategory] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sort, setSort] = useState<SortKey>('id-desc');

  const approved = adoptions.filter(item => item.status === 'APPROVED');
  const animalMap = new Map(animals.map(animal => [animal.id, animal]));

  const rows = useMemo(() => {
    const needle = debounced.trim().toLowerCase();
    const filtered = approved.filter(item => {
      if (needle && !`${item.id} ${item.adopterName} ${item.animalName}`.toLowerCase().includes(needle)) return false;
      if (category !== 'ALL' && animalMap.get(item.animalId)?.category !== category) return false;
      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      if (sort === 'id-asc') return a.id - b.id;
      if (sort === 'date-desc') return b.date.localeCompare(a.date);
      if (sort === 'date-asc') return a.date.localeCompare(b.date);
      if (sort === 'adopter') return a.adopterName.localeCompare(b.adopterName);
      return b.id - a.id;
    });
  }, [approved, category, dateFrom, dateTo, debounced, sort, animalMap]);

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Unable to load adoption records.'}
        onRetry={() => void refetch()}
      />
    );
  }

  const columns: Column<AdoptionApplication>[] = [
    { key: 'id', header: 'Adoption ID', cell: row => <span className="num font-medium">#{row.id}</span> },
    { key: 'animal', header: 'Animal', cell: row => <span className="font-medium">{row.animalName}</span> },
    { key: 'type', header: 'Type', cell: row => <span className="text-muted">{speciesLabel(animalMap.get(row.animalId)?.category ?? '—')}</span> },
    { key: 'adopter', header: 'Adopter', cell: row => row.adopterName },
    { key: 'contact', header: 'Contact', cell: row => <span className="num text-muted">{row.adopterContact}</span> },
    { key: 'date', header: 'Adoption date', cell: row => formatDate(row.date) },
    { key: 'status', header: 'Status', cell: row => <StatusBadge value={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cell: row => (
        <Button size="sm" variant="ghost" onClick={() => navigate(`/adoptions/${row.id}`)}>
          View details
        </Button>
      ),
    },
  ];

  const exportCsv = () => {
    downloadCsv(
      'pawcare-adoption-records.csv',
      ['ID', 'Animal', 'Adopter', 'Age', 'Contact', 'Date', 'Status'],
      rows.map(row => [row.id, row.animalName, row.adopterName, row.adopterAge, row.adopterContact, row.date, row.status]),
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <PageHeader
        title="Adoption records"
        description="Historical view of approved adoptions, sourced directly from adoption records."
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4">
          <p className="text-[11px] text-muted">Completed adoptions</p>
          <p className="num mt-1 font-display text-2xl font-semibold">{approved.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] text-muted">Application success rate</p>
          <p className="num mt-1 font-display text-2xl font-semibold">
            {(reports?.adoptionSuccessRate ?? 0).toFixed(1)}%
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-[11px] text-muted">Animals adopted</p>
          <p className="num mt-1 font-display text-2xl font-semibold">{adoptions.filter(item => item.status === 'APPROVED').length}</p>
        </div>
      </div>

      <Panel padded={false}>
        <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search ID, adopter or animal…" className="lg:w-72" />
          <Select value={category} onChange={event => setCategory(event.target.value)} className="w-40">
            <option value="ALL">All animal types</option>
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
            <option value="BIRD">Bird</option>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="date" value={dateFrom} onChange={event => setDateFrom(event.target.value)} className="w-36" />
            <span className="text-xs text-muted">to</span>
            <Input type="date" value={dateTo} onChange={event => setDateTo(event.target.value)} className="w-36" />
          </div>
          <Select value={sort} onChange={event => setSort(event.target.value as SortKey)} className="w-44 lg:ml-auto">
            <option value="id-desc">Sort: newest first</option>
            <option value="id-asc">Sort: oldest first</option>
            <option value="date-desc">Sort: latest date</option>
            <option value="date-asc">Sort: earliest date</option>
            <option value="adopter">Sort: adopter A–Z</option>
          </Select>
        </div>
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={row => row.id}
          loading={isLoading}
          onRowClick={row => navigate(`/adoptions/${row.id}`)}
          emptyTitle="No adoption records"
          emptyDescription="Approved applications will appear here."
        />
      </Panel>

      <div className="flex items-center gap-2 text-xs text-muted">
        <TrendingUp className="h-3.5 w-3.5 text-brand" />
        <HeartHandshake className="h-3.5 w-3.5 text-brand" />
        Figures are derived from approved applications stored by the backend.
      </div>
    </div>
  );
}
