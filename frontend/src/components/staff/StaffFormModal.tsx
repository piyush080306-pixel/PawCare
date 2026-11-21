import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import type { StaffCreateInput, StaffMember, StaffRole } from '@/types/shelter';
import { useCreateStaff, useUpdateStaff } from '@/services/api/queries';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: StaffMember | null;
}

type Errors = Partial<Record<keyof StaffCreateInput, string>>;

const EMPTY: StaffCreateInput = {
  role: 'CARETAKER',
  name: '',
  contactNumber: '',
  age: 25,
  salary: 25000,
  department: 'Operations',
  specialization: 'General',
  licenseNumber: '',
  shift: 'Morning',
  assignedArea: 'Kennel A',
};

export function StaffFormModal({ open, onOpenChange, member }: Props) {
  const create = useCreateStaff();
  const update = useUpdateStaff();
  const [form, setForm] = useState<StaffCreateInput>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (member) {
      setForm({
        role: member.role,
        name: member.name,
        contactNumber: member.contactNumber,
        age: member.age,
        salary: member.salary,
        department: member.department ?? 'Operations',
        specialization: member.specialization ?? 'General',
        licenseNumber: member.licenseNumber ?? '',
        shift: member.shift ?? 'Morning',
        assignedArea: member.assignedArea ?? 'Kennel A',
      });
    } else {
      setForm({ ...EMPTY });
    }
  }, [member, open]);

  const set = <K extends keyof StaffCreateInput>(key: K, value: StaffCreateInput[K]) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined }));
  };

  const submit = async () => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    if (!form.contactNumber.trim()) next.contactNumber = 'Contact number is required.';
    if (form.age < 18 || form.age > 80) next.age = 'Age must be between 18 and 80.';
    if (form.salary < 0) next.salary = 'Salary cannot be negative.';
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    try {
      if (member) {
        await update.mutateAsync({
          id: member.id,
          input: {
            name: form.name.trim(),
            contactNumber: form.contactNumber.trim(),
            age: form.age,
            salary: form.salary,
          },
        });
      } else {
        await create.mutateAsync(form);
      }
      onOpenChange(false);
    } catch {
      // handled by mutation hook
    }
  };

  const busy = create.isPending || update.isPending;
  const editing = Boolean(member);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${member?.name}` : 'Onboard staff member'}
      description={
        editing
          ? 'Role is fixed after creation in the current backend model.'
          : 'The selected role determines the role-specific fields stored by the backend.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => void submit()} loading={busy}>
            {editing ? 'Save changes' : 'Add staff'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required error={errors.name}>
          <Input value={form.name} onChange={event => set('name', event.target.value)} />
        </Field>
        <Field label="Contact number" required error={errors.contactNumber}>
          <Input
            value={form.contactNumber}
            onChange={event => set('contactNumber', event.target.value)}
          />
        </Field>
        <Field label="Role" required>
          <Select
            value={form.role}
            disabled={editing}
            onChange={event => set('role', event.target.value as StaffRole)}
          >
            <option value="MANAGER">Manager</option>
            <option value="VETERINARIAN">Veterinarian</option>
            <option value="CARETAKER">Caretaker</option>
          </Select>
        </Field>
        <Field label="Age" required error={errors.age}>
          <Input
            type="number"
            min={18}
            value={form.age}
            onChange={event => set('age', Number(event.target.value))}
          />
        </Field>
        <Field label="Monthly salary (₹)" required error={errors.salary}>
          <Input
            type="number"
            min={0}
            value={form.salary}
            onChange={event => set('salary', Number(event.target.value))}
          />
        </Field>

        {form.role === 'MANAGER' ? (
          <Field label="Department">
            <Input
              value={form.department ?? ''}
              onChange={event => set('department', event.target.value)}
            />
          </Field>
        ) : null}
        {form.role === 'VETERINARIAN' ? (
          <>
            <Field label="Specialization">
              <Input
                value={form.specialization ?? ''}
                onChange={event => set('specialization', event.target.value)}
              />
            </Field>
            <Field label="License number">
              <Input
                value={form.licenseNumber ?? ''}
                onChange={event => set('licenseNumber', event.target.value)}
              />
            </Field>
          </>
        ) : null}
        {form.role === 'CARETAKER' ? (
          <>
            <Field label="Shift">
              <Select value={form.shift ?? 'Morning'} onChange={event => set('shift', event.target.value)}>
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </Select>
            </Field>
            <Field label="Assigned area">
              <Input
                value={form.assignedArea ?? ''}
                onChange={event => set('assignedArea', event.target.value)}
              />
            </Field>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
