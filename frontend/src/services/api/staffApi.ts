import { apiClient } from './apiClient';
import type { StaffCreateInput, StaffMember, StaffUpdateInput } from '@/types/shelter';

export const staffApi = {
  list: async (role?: string): Promise<StaffMember[]> => {
    const { data } = await apiClient.get<StaffMember[]>('/staff', {
      params: role && role !== 'ALL' ? { role } : undefined,
    });
    return data;
  },
  get: async (id: number): Promise<StaffMember> => {
    const { data } = await apiClient.get<StaffMember>(`/staff/${id}`);
    return data;
  },
  create: async (input: StaffCreateInput): Promise<StaffMember> => {
    const { data } = await apiClient.post<StaffMember>('/staff', input);
    return data;
  },
  update: async (id: number, input: StaffUpdateInput): Promise<StaffMember> => {
    const { data } = await apiClient.put<StaffMember>(`/staff/${id}`, input);
    return data;
  },
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};
