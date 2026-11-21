import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdoptionApplication,
  AdoptionCreateInput,
  AnimalCreateInput,
  AnimalUpdateInput,
  MedicalRecord,
  MedicalRecordCreateInput,
  StaffCreateInput,
  StaffUpdateInput,
  VaccinationStatus,
} from '@/types/shelter';
import { toast } from '@/store/toast';
import { adoptionApi } from './adoptionApi';
import { animalApi } from './animalApi';
import { healthApi } from './healthApi';
import { reportApi } from './reportApi';
import { staffApi } from './staffApi';

export const qk = {
  animals: ['animals'] as const,
  animal: (id: number) => ['animals', id] as const,
  staff: ['staff'] as const,
  staffMember: (id: number) => ['staff', id] as const,
  adoptions: ['adoptions'] as const,
  adoption: (id: number) => ['adoptions', id] as const,
  health: ['health'] as const,
  healthRecord: (id: number) => ['health', id] as const,
  healthForAnimal: (id: number) => ['health', 'animal', id] as const,
  dashboard: ['dashboard'] as const,
  reports: ['reports'] as const,
};

function reportError(error: unknown): void {
  toast.error(error instanceof Error ? error.message : 'The request could not be completed.');
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>): void {
  void qc.invalidateQueries({ queryKey: qk.animals });
  void qc.invalidateQueries({ queryKey: qk.staff });
  void qc.invalidateQueries({ queryKey: qk.adoptions });
  void qc.invalidateQueries({ queryKey: qk.health });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
  void qc.invalidateQueries({ queryKey: qk.reports });
}

/* ------------------------------------------------------------------ reads */

export const useAnimals = () => useQuery({ queryKey: qk.animals, queryFn: () => animalApi.list() });
export const useAnimal = (id: number | undefined) =>
  useQuery({
    queryKey: qk.animal(id ?? -1),
    queryFn: () => animalApi.get(id as number),
    enabled: Number.isFinite(id),
  });

export const useStaff = () => useQuery({ queryKey: qk.staff, queryFn: () => staffApi.list() });
export const useStaffMember = (id: number | undefined) =>
  useQuery({
    queryKey: qk.staffMember(id ?? -1),
    queryFn: () => staffApi.get(id as number),
    enabled: Number.isFinite(id),
  });

export const useAdoptions = () =>
  useQuery({ queryKey: qk.adoptions, queryFn: () => adoptionApi.list() });
export const useAdoption = (id: number | undefined) =>
  useQuery({
    queryKey: qk.adoption(id ?? -1),
    queryFn: () => adoptionApi.get(id as number),
    enabled: Number.isFinite(id),
  });

export const useHealth = () => useQuery({ queryKey: qk.health, queryFn: () => healthApi.list() });
export const useHealthForAnimal = (id: number | undefined) =>
  useQuery({
    queryKey: qk.healthForAnimal(id ?? -1),
    queryFn: () => healthApi.forAnimal(id as number),
    enabled: Number.isFinite(id),
  });

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: () => reportApi.dashboard() });
export const useReports = () =>
  useQuery({ queryKey: qk.reports, queryFn: () => reportApi.reports() });

/* --------------------------------------------------------------- mutations */

export function useCreateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnimalCreateInput) => animalApi.create(input),
    onSuccess: animal => {
      toast.success(`${animal.name} registered · ID #${animal.id}`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useUpdateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: AnimalUpdateInput }) =>
      animalApi.update(id, input),
    onSuccess: animal => {
      toast.success(`${animal.name}'s profile updated`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => animalApi.remove(id),
    onSuccess: () => {
      toast.success('Animal record removed');
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StaffCreateInput) => staffApi.create(input),
    onSuccess: member => {
      toast.success(`${member.name} added to the roster`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: StaffUpdateInput }) =>
      staffApi.update(id, input),
    onSuccess: member => {
      toast.success(`${member.name}'s record updated`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staffApi.remove(id),
    onSuccess: () => {
      toast.success('Staff member removed');
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useCreateAdoption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AdoptionCreateInput) => adoptionApi.create(input),
    onSuccess: application => {
      toast.success(`Application #${application.id} submitted for ${application.animalName}`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

function useAdoptionDecision(decision: 'approve' | 'reject') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      decision === 'approve' ? adoptionApi.approve(id) : adoptionApi.reject(id),
    onMutate: async (id: number) => {
      await qc.cancelQueries({ queryKey: qk.adoptions });
      const previous = qc.getQueryData<AdoptionApplication[]>(qk.adoptions);
      const status = decision === 'approve' ? 'APPROVED' : 'REJECTED';
      qc.setQueryData<AdoptionApplication[]>(qk.adoptions, rows =>
        rows?.map(row => (row.id === id ? { ...row, status } : row)),
      );
      return { previous };
    },
    onSuccess: application => {
      toast.success(
        decision === 'approve'
          ? `Application #${application.id} approved by the server`
          : `Application #${application.id} rejected`,
      );
      invalidateAll(qc);
    },
    onError: (error, _id, context) => {
      if (context?.previous) qc.setQueryData(qk.adoptions, context.previous);
      reportError(error);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.adoptions });
    },
  });
}

export const useApproveAdoption = () => useAdoptionDecision('approve');
export const useRejectAdoption = () => useAdoptionDecision('reject');

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MedicalRecordCreateInput) => healthApi.create(input),
    onSuccess: record => {
      toast.success(`Medical record #${record.id} logged for ${record.animalName}`);
      invalidateAll(qc);
    },
    onError: reportError,
  });
}

export function useUpdateVaccination() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      nextVaccinationDate,
    }: {
      id: number;
      status: VaccinationStatus;
      nextVaccinationDate: string;
    }) => healthApi.updateVaccination(id, { status, nextVaccinationDate }),
    onMutate: async ({ id, status, nextVaccinationDate }) => {
      await qc.cancelQueries({ queryKey: qk.health });
      const previous = qc.getQueryData<MedicalRecord[]>(qk.health);
      qc.setQueryData<MedicalRecord[]>(qk.health, rows =>
        rows?.map(row =>
          row.id === id ? { ...row, vaccinationStatus: status, nextVaccinationDate } : row,
        ),
      );
      return { previous };
    },
    onSuccess: record => {
      toast.success(`Vaccination status saved for ${record.animalName}`);
      invalidateAll(qc);
    },
    onError: (error, _variables, context) => {
      if (context?.previous) qc.setQueryData(qk.health, context.previous);
      reportError(error);
    },
  });
}
