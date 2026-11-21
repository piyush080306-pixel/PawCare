import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Form';
import {
  useAnimals,
  useCreateMedicalRecord,
  useStaff,
} from '@/services/api/queries';
import { addDaysInput, todayInput } from '@/utils/format';
import type { VaccinationStatus } from '@/types/shelter';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimalId?: number | null;
}

export function HealthFormModal({ open, onOpenChange, preselectedAnimalId }: Props) {
  const { data: animals = [] } = useAnimals();
  const { data: staff = [] } = useStaff();
  const create = useCreateMedicalRecord();
  const vets = staff.filter(member => member.role === 'VETERINARIAN');

  const [animalId, setAnimalId] = useState('');
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState<VaccinationStatus>('UNVACCINATED');
  const [treatment, setTreatment] = useState('');
  const [lastCheckup, setLastCheckup] = useState(todayInput());
  const [nextVaccination, setNextVaccination] = useState(addDaysInput(30));
  const [vetId, setVetId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setCondition('');
    setStatus('UNVACCINATED');
    setTreatment('');
    setLastCheckup(todayInput());
    setNextVaccination(addDaysInput(30));
    setVetId('');
    setAnimalId(String(preselectedAnimalId ?? animals[0]?.id ?? ''));
  }, [open, preselectedAnimalId, animals]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!animalId) next.animalId = 'Select an animal.';
    if (!condition.trim()) next.condition = 'Medical condition is required.';
    if (!treatment.trim()) next.treatment = 'Treatment details are required.';
    if (!lastCheckup) next.lastCheckup = 'Last checkup date is required.';
    if (!nextVaccination) next.nextVaccination = 'Next vaccination date is required.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      await create.mutateAsync({
        animalId: Number(animalId),
        medicalCondition: condition.trim(),
        vaccinationStatus: status,
        treatmentDetails: treatment.trim(),
        lastCheckupDate: lastCheckup,
        nextVaccinationDate: nextVaccination,
        assignedVetId: vetId ? Number(vetId) : null,
      });
      onOpenChange(false);
    } catch {
      // handled by mutation hook
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Log medical record"
      description="Records are validated and stored by the HealthService."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={create.isPending}>
            Save record
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Animal" required error={errors.animalId}>
          <Select value={animalId} onChange={event => setAnimalId(event.target.value)}>
            {animals.length === 0 ? <option value="">No animals registered</option> : null}
            {animals.map(animal => (
              <option key={animal.id} value={animal.id}>
                #{animal.id} · {animal.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Medical condition" required error={errors.condition}>
          <Input value={condition} onChange={event => setCondition(event.target.value)} />
        </Field>
        <Field label="Vaccination status" required>
          <Select
            value={status}
            onChange={event => setStatus(event.target.value as VaccinationStatus)}
          >
            <option value="UNVACCINATED">Unvaccinated</option>
            <option value="PARTIAL">Partial</option>
            <option value="VACCINATED">Vaccinated</option>
          </Select>
        </Field>
        <Field label="Attending veterinarian">
          <Select value={vetId} onChange={event => setVetId(event.target.value)}>
            <option value="">Unassigned</option>
            {vets.map(vet => (
              <option key={vet.id} value={vet.id}>
                Dr. {vet.name} · {vet.specialization ?? 'General'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Last checkup" required error={errors.lastCheckup}>
          <Input
            type="date"
            value={lastCheckup}
            onChange={event => setLastCheckup(event.target.value)}
          />
        </Field>
        <Field label="Next vaccination" required error={errors.nextVaccination}>
          <Input
            type="date"
            value={nextVaccination}
            onChange={event => setNextVaccination(event.target.value)}
          />
        </Field>
        <Field label="Treatment details" required error={errors.treatment} className="sm:col-span-2">
          <Textarea value={treatment} onChange={event => setTreatment(event.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
