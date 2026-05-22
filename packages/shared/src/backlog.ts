export type BacklogItemPriority = "P0" | "P1" | "P2" | "P3";

export const BACKLOG_ITEM_PRIORITIES: readonly BacklogItemPriority[] = ["P0", "P1", "P2", "P3"] as const;

export function isBacklogItemPriority(value: string): value is BacklogItemPriority {
  return BACKLOG_ITEM_PRIORITIES.includes(value as BacklogItemPriority);
}

export type BacklogItemStatus = "idea" | "in_planning" | "consumed" | "dropped";

export const BACKLOG_ITEM_STATUSES: readonly BacklogItemStatus[] = ["idea", "in_planning", "consumed", "dropped"] as const;

export function isBacklogItemStatus(value: string): value is BacklogItemStatus {
  return BACKLOG_ITEM_STATUSES.includes(value as BacklogItemStatus);
}

export interface BacklogItem {
  id: string;
  board_id: string;
  title: string;
  description: string | null;
  priority: BacklogItemPriority;
  status: BacklogItemStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  consumed_at: string | null;
  consumed_into_task_id: string | null;
}

export interface CreateBacklogItemInput {
  title: string;
  description?: string | null;
  priority: BacklogItemPriority;
  status?: Extract<BacklogItemStatus, "idea" | "in_planning">;
}

export interface UpdateBacklogItemInput {
  title?: string;
  description?: string | null;
  priority?: BacklogItemPriority;
  status?: BacklogItemStatus;
}
