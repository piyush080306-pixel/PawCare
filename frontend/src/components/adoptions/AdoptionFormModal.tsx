import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { useAnimals, useCreateAdoption } from '@/services/api/queries';
import { animalSubtitle } from '@/utils/format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedAnimalId?: number | null;
}

export function AdoptionFormModal({ open, onOpenChange, preselectedAnimalId }: Props) {
  const { data: animals = [], isLoading } = useAnimals();
  const create = useCreateAdoption();
  const available = useMemo(() => animals.filter(animal => !animal.isAdopted), [animals]);
  const [animalId, setAnimalId] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState(25);
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName('');
    setAge(25);
    setContact('');
    const preselected = available.find(animal => animal.id === preselectedAnimalId);
    setAnimalId(String(preselected?.id ?? available[0]?.id ?? ''));
  }, [open, preselectedAnimalId, available]);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (!animalId) next.animalId = 'Select an available animal.';
    if (!name.trim()) next.name = 'Adopter name is required.';
    if (age < 18) next.age = 'Adopter must be at least 18 years old.';
    if (!contact.trim()) next.contact = 'Contact number is required.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      await create.mutateAsync({
        animalId: Number(animalId),
        adopterName: name.trim(),
        adopterAge: age,
        adopterContact: contact.trim(),
      });
      onOpenChange(false);
    } catch {
      // handled by mutation hook
    }
  };

  const selected = available.find(animal => animal.id === Number(animalId));

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="New adoption application"
      description="Submit an application for an available animal. Approval is handled by the Scala backend."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={create.isPending}>
            Submit application
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Animal"
          required
          error={errors.animalId}
          className="sm:col-span-2"
          hint={selected ? `${animalSubtitle(selected)} · ${selected.healthStatus}` : undefined}
        >
          <Select value={animalId} onChange={event => setAnimalId(event.target.value)}>
            {isLoading ? <option value="">Loading animals…</option> : null}
            {!isLoading && available.length === 0 ? (
              <option value="">No available animals</option>
            ) : null}
            {available.map(animal => (
              <option key={animal.id} value={animal.id}>
                #{animal.id} · {animal.name} · {animalSubtitle(animal)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Adopter name" required error={errors.name}>
          <Input value={name} onChange={event => setName(event.target.value)} />
        </Field>
        <Field label="Adopter age" required error={errors.age}>
          <Input
            type="number"
            min={18}
            value={age}
            onChange={event => setAge(Number(event.target.value))}
          />
        </Field>
        <Field label="Contact number" required error={errors.contact} className="sm:col-span-2">
          <Input value={contact} onChange={event => setContact(event.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
