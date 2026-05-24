import type { BacklogItem, BacklogItemPriority } from "@agent-kanban/shared";
import { BacklogItemCard } from "./BacklogItemCard";

interface BacklogPriorityGroupProps {
  priority: BacklogItemPriority;
  items: BacklogItem[];
  selectedIds?: Set<string>;
  onSelect?: (item: BacklogItem, selected: boolean) => void;
  onEdit: (item: BacklogItem) => void;
  onDelete: (item: BacklogItem) => void;
}

const PRIORITY_DESCRIPTIONS: Record<BacklogItemPriority, string> = {
  P0: "Critical — must do",
  P1: "High",
  P2: "Medium",
  P3: "Low — nice to have",
};

export function BacklogPriorityGroup({ priority, items, selectedIds, onSelect, onEdit, onDelete }: BacklogPriorityGroupProps) {
  return (
    <section data-testid="backlog-priority-group" data-priority={priority} aria-label={`Priority ${priority}`} className="space-y-2">
      <header className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-content-secondary">{priority}</h2>
          <p className="text-xs text-content-tertiary">{PRIORITY_DESCRIPTIONS[priority]}</p>
        </div>
        <span className="font-mono text-[11px] text-content-tertiary tabular-nums">{items.length}</span>
      </header>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-border bg-surface-secondary px-3 py-2 text-xs text-content-tertiary">
          No {priority} items.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <BacklogItemCard item={item} selected={selectedIds?.has(item.id)} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
