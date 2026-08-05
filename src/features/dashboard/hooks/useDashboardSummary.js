import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { queryKeys } from '@/lib/queryKeys';

/** Stats + bookings for the signed-in guest. */
export const useDashboardSummary = () =>
  useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: dashboardService.getSummary,
    staleTime: 1000 * 30,
  });
