import type { TeamMember } from "@agent-kanban/shared";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export function useTeamMembers() {
  const {
    data: teamMembers = [],
    isLoading: loading,
    refetch,
  } = useQuery<TeamMember[]>({
    queryKey: ["team-members"],
    queryFn: () => api.teamMembers.list() as Promise<TeamMember[]>,
    refetchInterval: 30_000,
  });

  return { teamMembers, loading, refresh: refetch };
}

export function useTeamMember(username: string | undefined) {
  const {
    data: teamMember = null,
    isLoading: loading,
    refetch,
  } = useQuery<TeamMember | null>({
    queryKey: ["team-member", username],
    queryFn: () => api.teamMembers.get(username!) as Promise<TeamMember>,
    enabled: !!username,
    refetchInterval: 30_000,
  });

  return { teamMember, loading, refresh: refetch };
}
