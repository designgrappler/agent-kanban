import type { Sprint } from "@agent-kanban/shared";
import { useState } from "react";

import { useActiveSprint, useCloseSprint } from "../hooks/useSprint";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface SprintHeaderProps {
  boardId: string;
  tasks: Array<{ sprint_id: string | null; status: string }>;
}

const STATUS_VARIANT: Record<Sprint["status"], "default" | "secondary" | "outline"> = {
  planning: "outline",
  active: "default",
  closed: "secondary",
};

const STATUS_LABEL: Record<Sprint["status"], string> = {
  planning: "Planning",
  active: "Active",
  closed: "Closed",
};

function isFinal(status: string) {
  return status === "done" || status === "cancelled";
}

export function SprintHeader({ boardId, tasks }: SprintHeaderProps) {
  const { data: sprint, isLoading } = useActiveSprint(boardId);
  const closeSprint = useCloseSprint(sprint?.id, boardId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-5 pt-3 pb-2">
        <div className="h-4 w-40 bg-surface-tertiary rounded animate-pulse" />
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex items-center gap-2 px-5 pt-3 pb-2 text-xs text-content-tertiary" data-testid="sprint-header-empty">
        <span>No active sprint.</span>
        <span>
          Open one via <code className="font-mono text-[11px] bg-surface-tertiary px-1.5 py-0.5 rounded text-content-secondary">ak sprint open</code>
        </span>
      </div>
    );
  }

  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
  const allTracksFinal = sprintTasks.length > 0 && sprintTasks.every((t) => isFinal(t.status));
  const canClose = sprint.status === "active" && allTracksFinal;
  const showCloseButton = sprint.status === "active";

  const closeDisabledReason = !canClose
    ? sprintTasks.length === 0
      ? "Sprint has no tracks yet"
      : "All tracks must be done or cancelled before closing"
    : undefined;

  async function handleConfirmClose() {
    try {
      await closeSprint.mutateAsync();
      setConfirmOpen(false);
    } catch {
      // Mutation error surfaces in `closeSprint.error`; keep dialog open so the user can retry.
    }
  }

  return (
    <div
      data-testid="sprint-header"
      data-sprint-id={sprint.id}
      data-sprint-status={sprint.status}
      className="flex items-center justify-between gap-3 px-5 pt-3 pb-2"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[11px] uppercase tracking-wide text-content-tertiary shrink-0">Sprint {sprint.number}</span>
        <span className="text-sm font-medium text-content-primary truncate" title={sprint.theme}>
          {sprint.theme}
        </span>
        <Badge variant={STATUS_VARIANT[sprint.status]} className="shrink-0 font-mono text-[10px] uppercase tracking-wide">
          {STATUS_LABEL[sprint.status]}
        </Badge>
      </div>

      {showCloseButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={!canClose}
          aria-disabled={!canClose}
          title={closeDisabledReason}
          data-testid="sprint-close-button"
        >
          Close Sprint
        </Button>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !open && !closeSprint.isPending && setConfirmOpen(false)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Close sprint</DialogTitle>
            <DialogDescription>
              Close Sprint {sprint.number} ({sprint.theme})? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {closeSprint.error && <p className="text-xs text-error">{(closeSprint.error as Error).message}</p>}
          <DialogFooter className="flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={closeSprint.isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirmClose} disabled={closeSprint.isPending}>
              {closeSprint.isPending ? "Closing..." : "Close Sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
