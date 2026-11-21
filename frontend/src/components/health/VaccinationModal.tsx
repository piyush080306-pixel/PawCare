import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import type { MedicalRecord, VaccinationStatus } from '@/types/shelter';
import { useUpdateVaccination } from '@/services/api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: MedicalRecord | null;
}

export function VaccinationModal({ open, onOpenChange, record }: Props) {
  const update = useUpdateVaccination();
  const [status, setStatus] = useState<VaccinationStatus>('VACCINATED');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (!open || !record) return;
    setStatus(record.vaccinationStatus);
    setDate(record.nextVaccinationDate);
  }, [open, record]);

  const submit = async () => {
    if (!record || !date) return;
    try {
      await update.mutateAsync({ id: record.id, status, nextVaccinationDate: date });
      onOpenChange(false);
    } catch {
      // handled by mutation hook
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Update vaccination"
      description={record ? `${record.animalName} · ${record.condition}` : undefined}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={update.isPending}>
            Save update
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Vaccination status" required>
          <Select value={status} onChange={event => setStatus(event.target.value as VaccinationStatus)}>
            <option value="UNVACCINATED">Unvaccinated</option>
            <option value="PARTIAL">Partial</option>
            <option value="VACCINATED">Vaccinated</option>
          </Select>
        </Field>
        <Field label="Next vaccination date" required>
          <Input type="date" value={date} onChange={event => setDate(event.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
