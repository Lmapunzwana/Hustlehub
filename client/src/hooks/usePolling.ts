import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface UsePollingOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey'> {
  queryKey: string[];
  interval: number;
  enabled?: boolean;
}

export function usePolling<T>({
  queryKey,
  interval,
  enabled = true,
  ...options
}: UsePollingOptions<T>) {
  return useQuery<T>({
    queryKey,
    refetchInterval: enabled ? interval : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    enabled,
    ...options,
  });
}
