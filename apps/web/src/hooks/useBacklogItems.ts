import type { BacklogItem, BacklogItemStatus, CreateBacklogItemInput, UpdateBacklogItemInput } from "@agent-kanban/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

/**
 * Fetch the backlog items for a board, optionally filtered by status.
 * Backlog items are pre-task ideas grouped by priority (P0–P3).
 */
export function useBacklogItems(boardId: string | undefined, opts?: { status?: BacklogItemStatus }) {
  return useQuery<BacklogItem[]>({
    queryKey: ["backlog-items", boardId, opts?.status ?? "all"],
    enabled: !!boardId,
    queryFn: () => api.backlogItems.list(boardId!, opts),
    refetchInterval: 60_000,
  });
}

/** Alias used by the Backlog page for clarity. */
export { useBacklogItems as useBacklogList };

export function useCreateBacklogItem(boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateBacklogItemInput) => {
      if (!boardId) throw new Error("boardId is required");
      return api.backlogItems.create(boardId, body);
    },
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["backlog-items", boardId] });
      }
    },
  });
}

export function useUpdateBacklogItem(boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateBacklogItemInput }) => api.backlogItems.update(id, patch),
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["backlog-items", boardId] });
      }
    },
  });
}

export function useDeleteBacklogItem(boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.backlogItems.delete(id),
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["backlog-items", boardId] });
      }
    },
  });
}

export function useBulkMarkInPlanning(boardId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => api.backlogItems.bulkMarkInPlanning(ids),
    onSuccess: () => {
      if (boardId) {
        queryClient.invalidateQueries({ queryKey: ["backlog-items", boardId] });
      }
    },
  });
}
