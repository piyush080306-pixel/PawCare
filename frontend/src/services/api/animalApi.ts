import { apiClient } from './apiClient';
import type { Animal, AnimalCreateInput, AnimalUpdateInput } from '@/types/shelter';

export interface AnimalQuery {
  category?: string;
  status?: string;
  q?: string;
}

export const animalApi = {
  list: async (query: AnimalQuery = {}): Promise<Animal[]> => {
    const { data } = await apiClient.get<Animal[]>('/animals', {
      params: Object.fromEntries(Object.entries(query).filter(([, value]) => Boolean(value))),
    });
    return data;
  },
  get: async (id: number): Promise<Animal> => {
    const { data } = await apiClient.get<Animal>(`/animals/${id}`);
    return data;
  },
  create: async (input: AnimalCreateInput): Promise<Animal> => {
    const { data } = await apiClient.post<Animal>('/animals', input);
    return data;
  },
  update: async (id: number, input: AnimalUpdateInput): Promise<Animal> => {
    const { data } = await apiClient.put<Animal>(`/animals/${id}`, input);
    return data;
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/animals/${id}`);
  },
};
