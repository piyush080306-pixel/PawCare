import { apiClient } from './apiClient';
import type {
  MedicalRecord,
  MedicalRecordCreateInput,
  VaccinationUpdateInput,
} from '@/types/shelter';

export const healthApi = {
  list: async (): Promise<MedicalRecord[]> => {
    const { data } = await apiClient.get<MedicalRecord[]>('/health');
    return data;
  },
  forAnimal: async (animalId: number): Promise<MedicalRecord[]> => {
    const { data } = await apiClient.get<MedicalRecord[]>(`/health/animal/${animalId}`);
    return data;
  },
  get: async (id: number): Promise<MedicalRecord> => {
    const { data } = await apiClient.get<MedicalRecord>(`/health/${id}`);
    return data;
  },
  create: async (input: MedicalRecordCreateInput): Promise<MedicalRecord> => {
    const { data } = await apiClient.post<MedicalRecord>('/health', input);
    return data;
  },
  updateVaccination: async (
    id: number,
    input: VaccinationUpdateInput,
  ): Promise<MedicalRecord> => {
    const { data } = await apiClient.post<MedicalRecord>(`/health/${id}/vaccination`, input);
    return data;
  },
};
