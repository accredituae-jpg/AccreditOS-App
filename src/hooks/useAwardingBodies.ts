import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGetAwardingBodies } from "@/lib/api/settingsApi";

export const AWARDING_BODIES_QUERY_KEY = ["awarding-bodies"] as const;

export function useAwardingBodies() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: AWARDING_BODIES_QUERY_KEY,
    queryFn: async () => {
      const data = await apiGetAwardingBodies();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const invalidateAwardingBodies = () => {
    queryClient.invalidateQueries({ queryKey: AWARDING_BODIES_QUERY_KEY });
  };

  return {
    awardingBodies: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidateAwardingBodies,
  };
}

export default useAwardingBodies;
