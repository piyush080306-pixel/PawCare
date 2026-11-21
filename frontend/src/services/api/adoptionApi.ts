import { apiClient } from './apiClient';
import type {
  AdoptionApplication,
  AdoptionCreateInput,
  AdoptionStatus,
} from '@/types/shelter';

export const adoptionApi = {
  list: async (status?: AdoptionStatus): Promise<AdoptionApplication[]> => {
    const { data } = await apiClient.get<AdoptionApplication[]>('/adoptions', {
      params: status ? { status } : undefined,
    });
    return data;
  },
  get: async (id: number): Promise<AdoptionApplication> => {
    const { data } = await apiClient.get<AdoptionApplication>(`/adoptions/${id}`);
    return data;
  },
  create: async (input: AdoptionCreateInput): Promise<AdoptionApplication> => {
    const { data } = await apiClient.post<AdoptionApplication>('/adoptions', input);
    return data;
  },
  approve: async (id: number): Promise<AdoptionApplication> => {
    const { data } = await apiClient.post<AdoptionApplication>(`/adoptions/${id}/approve`);
    return data;
  },
  reject: async (id: number): Promise<AdoptionApplication> => {
    const { data } = await apiClient.post<AdoptionApplication>(`/adoptions/${id}/reject`);
    return data;
  },
};
