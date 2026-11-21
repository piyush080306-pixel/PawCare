import { apiClient } from './apiClient';
import type { DashboardMetrics, ReportMetrics } from '@/types/shelter';

export const reportApi = {
  dashboard: async (): Promise<DashboardMetrics> => {
    const { data } = await apiClient.get<DashboardMetrics>('/dashboard');
    return data;
  },
  reports: async (): Promise<ReportMetrics> => {
    const { data } = await apiClient.get<ReportMetrics>('/reports');
    return data;
  },
};
