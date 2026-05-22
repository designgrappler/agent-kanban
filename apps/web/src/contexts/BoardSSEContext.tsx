import type { BoardAction } from "@agent-kanban/shared";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import { getAuthToken, refreshAuthToken } from "../lib/auth-client";

const MAX_EVENTS = 50;

interface BoardSSEContextValue {
  events: BoardAction[];
  connected: boolean;
}

const BoardSSEContext = createContext<BoardSSEContextValue | null>(null);

interface BoardSSEProviderProps {
  boardId: string | undefined;
  children: ReactNode;
}

/**
 * Opens exactly one EventSource per board mount and shares the resulting
 * event stream with all descendants via context. Both `useBoard` and
 * `useAgentPresence` consume this single connection so the per-mount count
 * stays at 1 instead of 2 (Chrome caps EventSources at ~6 per origin).
 *
 * Lifecycle:
 *   - Open one EventSource for the current `boardId`.
 *   - Reconnect with 2s backoff on transport errors.
 *   - Close + reopen when `boardId` changes.
 *   - Close on unmount.
 *
 * Behaviour mirrors the previous per-hook `useBoardSSE` implementation;
 * this is a pure refactor.
 */
export function BoardSSEProvider({ boardId, children }: BoardSSEProviderProps) {
  const [events, setEvents] = useState<BoardAction[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    // Reset event buffer when boardId changes so consumers don't see stale events
    // from a previous board.
    setEvents([]);
    setConnected(false);

    if (!boardId) return;

    let cancelled = false;

    async function connect() {
      esRef.current?.close();

      // Read token on every reconnect so refreshed tokens are picked up.
      const token = (await refreshAuthToken()) ?? getAuthToken();
      if (!token || cancelled) return;

      const url = `/api/boards/${boardId}/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.addEventListener("board_note", (e: MessageEvent) => {
        const note: BoardAction = JSON.parse(e.data);
        setEvents((prev) => {
          if (prev.some((existing) => existing.id === note.id)) return prev;
          const next = [...prev, note];
          return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
        });
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        setConnected(false);
        if (cancelled) return;
        reconnectTimer.current = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = undefined;
      }
    };
  }, [boardId]);

  return <BoardSSEContext.Provider value={{ events, connected }}>{children}</BoardSSEContext.Provider>;
}

/**
 * Consume the shared board SSE connection. Returns `{ events, connected }`
 * with the same shape the previous `useBoardSSE(boardId)` hook produced.
 *
 * If no `<BoardSSEProvider>` is mounted in an ancestor, returns an empty
 * stream rather than throwing — this keeps the hook safe to call from
 * components that may render outside a board context (e.g. tests).
 */
export function useBoardSSE(): BoardSSEContextValue {
  const ctx = useContext(BoardSSEContext);
  if (!ctx) {
    return EMPTY_VALUE;
  }
  return ctx;
}

const EMPTY_VALUE: BoardSSEContextValue = { events: [], connected: false };
