import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox, Field, Input, Select } from '@/components/ui/Form';
import type { Animal, AnimalCreateInput, Species } from '@/types/shelter';
import { useCreateAnimal, useUpdateAnimal } from '@/services/api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal?: Animal | null;
}

type Errors = Partial<Record<keyof AnimalCreateInput, string>>;

const EMPTY: AnimalCreateInput = {
  category: 'DOG',
  name: '',
  age: 1,
  gender: 'Male',
  healthStatus: 'Healthy',
  breed: '',
  size: 'Medium',
  isTrained: false,
  furColor: '',
  isIndoorFriendly: true,
  species: 'Parrot',
  wingspan: 0.3,
  canFly: true,
};

export function AnimalFormModal({ open, onOpenChange, animal }: Props) {
  const create = useCreateAnimal();
  const update = useUpdateAnimal();
  const [form, setForm] = useState<AnimalCreateInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (animal) {
      setForm({
        category: animal.category,
        name: animal.name,
        age: animal.age,
        gender: animal.gender,
        healthStatus: animal.healthStatus,
        breed: animal.breed ?? '',
        size: animal.size ?? 'Medium',
        isTrained: animal.isTrained ?? false,
        furColor: animal.furColor ?? '',
        isIndoorFriendly: animal.isIndoorFriendly ?? true,
        species: animal.species ?? 'Parrot',
        wingspan: animal.wingspan ?? 0.3,
        canFly: animal.canFly ?? true,
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [animal, open]);

  const set = <K extends keyof AnimalCreateInput>(key: K, value: AnimalCreateInput[K]) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };

  const submit = async () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Animal name is required.';
    if (!Number.isInteger(form.age) || form.age < 0) next.age = 'Enter a valid age.';
    if (!form.gender.trim()) next.gender = 'Gender is required.';
    if (!form.healthStatus.trim()) next.healthStatus = 'Health status is required.';
    if (form.category === 'DOG' && !form.breed?.trim()) next.breed = 'Breed is required.';
    if (form.category === 'CAT' && !form.furColor?.trim()) next.furColor = 'Fur colour is required.';
    if (form.category === 'BIRD') {
      if (!form.species?.trim()) next.species = 'Species is required.';
      if (form.wingspan == null || form.wingspan <= 0) next.wingspan = 'Enter a valid wingspan.';
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    try {
      if (animal) {
        await update.mutateAsync({
          id: animal.id,
          input: {
            name: form.name.trim(),
            age: form.age,
            gender: form.gender.trim(),
            healthStatus: form.healthStatus.trim(),
          },
        });
      } else {
        await create.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      // Error toast is emitted by the mutation hook.
    }
  };

  const busy = create.isPending || update.isPending;
  const editing = Boolean(animal);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${animal?.name}` : 'Register a new animal'}
      description={
        editing
          ? 'The backend supports updating name, age, gender and health status.'
          : 'Intake details are validated by the Scala service before they are stored.'
      }
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            {editing ? 'Save changes' : 'Register animal'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Animal name" required error={errors.name}>
          <Input
            value={form.name}
            onChange={event => set('name', event.target.value)}
            placeholder="e.g. Bruno"
          />
        </Field>
        <Field label="Animal type" required>
          <Select
            value={form.category}
            onChange={event => set('category', event.target.value as Species)}
            disabled={editing}
          >
            <option value="DOG">Dog</option>
            <option value="CAT">Cat</option>
            <option value="BIRD">Bird</option>
          </Select>
        </Field>
        <Field label="Age (years)" required error={errors.age}>
          <Input
            type="number"
            min={0}
            value={form.age}
            onChange={event => set('age', Number(event.target.value))}
          />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select value={form.gender} onChange={event => set('gender', event.target.value)}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </Select>
        </Field>
        <Field label="Health status" required error={errors.healthStatus}>
          <Select
            value={form.healthStatus}
            onChange={event => set('healthStatus', event.target.value)}
          >
            <option value="Healthy">Healthy</option>
            <option value="Under Treatment">Under Treatment</option>
            <option value="Observation">Observation</option>
          </Select>
        </Field>

        {form.category === 'DOG' ? (
          <>
            <Field label="Breed" required error={errors.breed}>
              <Input value={form.breed ?? ''} onChange={event => set('breed', event.target.value)} />
            </Field>
            <Field label="Size">
              <Select value={form.size ?? 'Medium'} onChange={event => set('size', event.target.value)}>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Checkbox
                label="Training status"
                description="Mark if the dog has completed basic training."
                checked={Boolean(form.isTrained)}
                onChange={event => set('isTrained', event.target.checked)}
              />
            </div>
          </>
        ) : null}

        {form.category === 'CAT' ? (
          <>
            <Field label="Breed">
              <Input value={form.breed ?? ''} onChange={event => set('breed', event.target.value)} />
            </Field>
            <Field label="Fur colour" required error={errors.furColor}>
              <Input
                value={form.furColor ?? ''}
                onChange={event => set('furColor', event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox
                label="Indoor friendly"
                checked={Boolean(form.isIndoorFriendly)}
                onChange={event => set('isIndoorFriendly', event.target.checked)}
              />
            </div>
          </>
        ) : null}

        {form.category === 'BIRD' ? (
          <>
            <Field label="Species" required error={errors.species}>
              <Input
                value={form.species ?? ''}
                onChange={event => set('species', event.target.value)}
                placeholder="e.g. Parrot"
              />
            </Field>
            <Field label="Wingspan (m)" required error={errors.wingspan}>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={form.wingspan ?? 0}
                onChange={event => set('wingspan', Number(event.target.value))}
              />
            </Field>
            <div className="sm:col-span-2">
              <Checkbox
                label="Can fly"
                checked={Boolean(form.canFly)}
                onChange={event => set('canFly', event.target.checked)}
              />
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
