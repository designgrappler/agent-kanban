import type { TaskActionType } from "@agent-kanban/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { api } from "../lib/api";
import { useBoardSSE } from "./useBoardSSE";

const LAST_BOARD_KEY = "ak-last-board";

// Status-changing task actions that should trigger a board refetch.
// Excludes "created", "moved", "commented", "assigned" (no column change).
const STATUS_CHANGING_ACTIONS = new Set<TaskActionType>([
  "claimed",
  "completed",
  "released",
  "timed_out",
  "cancelled",
  "rejected",
  "review_requested",
]);

/** Remember last visited board for redirect from "/" */
export function getLastBoardId(): string | null {
  return localStorage.getItem(LAST_BOARD_KEY);
}

export function setLastBoardId(id: string) {
  localStorage.setItem(LAST_BOARD_KEY, id);
}

export function clearLastBoardId(id: string) {
  if (localStorage.getItem(LAST_BOARD_KEY) === id) localStorage.removeItem(LAST_BOARD_KEY);
}

/** Fetch a single board by ID (from URL params) */
export function useBoard(boardId: string | undefined) {
  const queryClient = useQueryClient();
  const {
    data: board = null,
    isLoading: loading,
    error: rawError,
    refetch,
  } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => api.boards.get(boardId!),
    enabled: !!boardId,
    refetchInterval: 60_000,
    retry: 2,
  });

  useEffect(() => {
    if (boardId && board) setLastBoardId(boardId);
  }, [boardId, board]);

  // Real-time updates: invalidate the board query when SSE reports a status-changing
  // task action so cards move columns within ~2s instead of waiting for the polling
  // interval. This opens a second EventSource alongside useAgentPresence's; React
  // Query dedupes the resulting refetches.
  const { events } = useBoardSSE(boardId);
  const processedRef = useRef(0);
  useEffect(() => {
    if (!boardId) return;
    const unprocessed = events.slice(processedRef.current);
    processedRef.current = events.length;
    if (unprocessed.some((e) => STATUS_CHANGING_ACTIONS.has(e.action))) {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    }
  }, [events, boardId, queryClient]);

  // Reset processed cursor when boardId changes so we don't carry indices across boards.
  useEffect(() => {
    processedRef.current = 0;
  }, [boardId]);

  const error = rawError ? ((rawError as any).message === "NOT_AUTHENTICATED" ? "NOT_AUTHENTICATED" : "Can't reach server") : null;

  return { board, loading, error, refresh: refetch };
}

/** Fetch the list of all boards (for switcher, redirect) */
export function useBoards() {
  const {
    data: boards = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["boards"],
    queryFn: () => api.boards.list(),
  });

  return { boards, loading, refresh: refetch };
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; type: "dev" | "ops"; description?: string; theme?: string }) => api.boards.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      description?: string;
      theme?: string | null;
      visibility?: "private" | "public";
      labels?: any[];
    }) => api.boards.update(id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ["board", data.id] });
    },
  });
}

export function useCreateBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, ...body }: { boardId: string; name: string; color: string; description?: string }) =>
      api.boards.createLabel(boardId, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ["board", data.id] });
    },
  });
}

export function useUpdateBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name, ...body }: { boardId: string; name: string; nextName?: string; color?: string; description?: string }) =>
      api.boards.updateLabel(boardId, name, { name: body.nextName, color: body.color, description: body.description }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ["board", data.id] });
    },
  });
}

export function useDeleteBoardLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, name }: { boardId: string; name: string }) => api.boards.deleteLabel(boardId, name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      if (data?.id) queryClient.invalidateQueries({ queryKey: ["board", data.id] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.boards.delete(id),
    onSuccess: (_data, id) => {
      clearLastBoardId(id);
      queryClient.setQueryData<any[]>(["boards"], (boards) => boards?.filter((board) => board.id !== id) ?? []);
      queryClient.removeQueries({ queryKey: ["board", id] });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
