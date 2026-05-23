import type { TeamMember } from "@agent-kanban/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export function useCreateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      display_name: string;
      role?: string;
      bio?: string;
      soul?: string;
      capabilities?: string[];
      handoff_to?: string[];
      skills?: string[];
      builtin?: boolean;
    }) => api.teamMembers.create(input) as Promise<TeamMember>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ username, file }: { username: string; file: File }) => api.teamMembers.uploadAvatar(username, file) as Promise<TeamMember>,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-member", data.username] });
    },
  });
}
