import type { Sprint } from "@agent-kanban/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Fetch the currently active or planning sprint for a board.
 * Treats a 404 (no active sprint) as a successful `null` result instead of an error.
 */
export function useActiveSprint(boardId: string | undefined) {
  return useQuery<Sprint | null>({
    queryKey: ["sprint", boardId, "active"],
    enabled: !!boardId,
    queryFn: async () => {
      try {
        return await api.sprints.getActive(boardId!);
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },
    refetchInterval: 60_000,
    retry: (failureCount, err: any) => {
      if (err?.status === 404) return false;
      return failureCount < 2;
    },
  });
}

/**
 * Close a sprint (PATCH status: "closed"). Invalidates the active-sprint query
 * and the board query for the supplied board.
 */
export function useCloseSprint(sprintId: string | undefined, boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!sprintId) throw new Error("sprintId is required");
      return api.sprints.transition(sprintId, "closed");
    },
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["sprint", boardId, "active"] });
        queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      }
    },
  });
}
