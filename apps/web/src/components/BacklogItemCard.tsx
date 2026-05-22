import type { BacklogItem, BacklogItemPriority, BacklogItemStatus } from "@agent-kanban/shared";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

interface BacklogItemCardProps {
  item: BacklogItem;
  onEdit: (item: BacklogItem) => void;
  onDelete: (item: BacklogItem) => void;
}

const PRIORITY_LABEL: Record<BacklogItemPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

const STATUS_LABEL: Record<BacklogItemStatus, string> = {
  idea: "Idea",
  in_planning: "In planning",
  consumed: "Consumed",
  dropped: "Dropped",
};

function StatusPill({ status }: { status: BacklogItemStatus }) {
  return (
    <span
      data-status={status}
      className="inline-flex items-center rounded font-mono text-[11px] font-medium uppercase tracking-[0.06em] px-1.5 py-0.5 bg-surface-tertiary text-content-tertiary data-[status=idea]:bg-accent-soft data-[status=idea]:text-accent data-[status=in_planning]:bg-surface-tertiary data-[status=in_planning]:text-content-secondary data-[status=consumed]:bg-surface-tertiary data-[status=consumed]:text-content-tertiary data-[status=dropped]:bg-surface-tertiary data-[status=dropped]:text-content-tertiary"
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function BacklogItemCard({ item, onEdit, onDelete }: BacklogItemCardProps) {
  const editable = item.status === "idea";
  return (
    <div
      data-testid="backlog-item-card"
      data-item-id={item.id}
      className="group/item rounded-md border border-border bg-surface-secondary p-3 transition-colors hover:bg-surface-tertiary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-content-tertiary">
              {PRIORITY_LABEL[item.priority]}
            </span>
            <StatusPill status={item.status} />
          </div>
          <p className="text-sm font-medium leading-snug text-content-primary">{item.title}</p>
          {item.description && <p className="text-xs leading-relaxed text-content-secondary whitespace-pre-wrap">{item.description}</p>}
        </div>
        {editable && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="icon-sm" aria-label={`Edit backlog item ${item.title}`} onClick={() => onEdit(item)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete backlog item ${item.title}`} onClick={() => onDelete(item)}>
              <Trash2 className="size-3.5 text-error" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
