import type { BacklogItem, CreateBacklogItemInput, UpdateBacklogItemInput } from "@agent-kanban/shared";
import { HTTPException } from "hono/http-exception";
import { type D1, newId } from "./db";

const ALLOWED_UPDATE_FIELDS = ["title", "description", "priority", "status"] as const;
type AllowedUpdateField = (typeof ALLOWED_UPDATE_FIELDS)[number];

export async function createBacklogItem(db: D1, boardId: string, input: CreateBacklogItemInput, createdBy: string): Promise<BacklogItem> {
  const id = newId();
  const now = new Date().toISOString();
  const description = input.description ?? null;
  const status = input.status ?? "idea";

  const inserted = await db
    .prepare(
      `INSERT INTO backlog_items (id, board_id, title, description, priority, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING *`,
    )
    .bind(id, boardId, input.title, description, input.priority, status, createdBy, now, now)
    .first<BacklogItem>();

  if (!inserted) throw new HTTPException(500, { message: "Failed to create backlog item" });
  return inserted;
}

export async function getBacklogItem(db: D1, id: string): Promise<BacklogItem | null> {
  const item = await db.prepare("SELECT * FROM backlog_items WHERE id = ?").bind(id).first<BacklogItem>();
  return item ?? null;
}

export async function listBacklogItemsByBoard(db: D1, boardId: string, opts?: { status?: string }): Promise<BacklogItem[]> {
  if (opts?.status) {
    const result = await db
      .prepare("SELECT * FROM backlog_items WHERE board_id = ? AND status = ? ORDER BY created_at DESC")
      .bind(boardId, opts.status)
      .all<BacklogItem>();
    return result.results;
  }
  const result = await db.prepare("SELECT * FROM backlog_items WHERE board_id = ? ORDER BY created_at DESC").bind(boardId).all<BacklogItem>();
  return result.results;
}

export async function updateBacklogItem(db: D1, id: string, updates: UpdateBacklogItemInput): Promise<BacklogItem> {
  const existing = await getBacklogItem(db, id);
  if (!existing) throw new HTTPException(404, { message: "Backlog item not found" });

  const setClauses: string[] = [];
  const values: unknown[] = [];

  for (const field of ALLOWED_UPDATE_FIELDS) {
    const key = field as AllowedUpdateField;
    if (Object.hasOwn(updates, key)) {
      setClauses.push(`${field} = ?`);
      values.push((updates as Record<string, unknown>)[key]);
    }
  }

  const now = new Date().toISOString();
  setClauses.push("updated_at = ?");
  values.push(now);

  if (updates.status === "consumed" && existing.status !== "consumed") {
    setClauses.push("consumed_at = ?");
    values.push(now);
  }

  values.push(id);

  await db
    .prepare(`UPDATE backlog_items SET ${setClauses.join(", ")} WHERE id = ?`)
    .bind(...values)
    .run();

  const updated = await getBacklogItem(db, id);
  if (!updated) throw new HTTPException(500, { message: "Failed to update backlog item" });
  return updated;
}

export async function deleteBacklogItem(db: D1, id: string): Promise<void> {
  await db.prepare("DELETE FROM backlog_items WHERE id = ?").bind(id).run();
}

export async function assertBoardOwnerForBacklog(db: D1, boardId: string, ownerId: string): Promise<void> {
  const row = await db.prepare("SELECT 1 FROM boards WHERE id = ? AND owner_id = ?").bind(boardId, ownerId).first();
  if (!row) throw new HTTPException(404, { message: "Board not found" });
}

export async function assertBacklogItemOwner(db: D1, id: string, ownerId: string): Promise<BacklogItem> {
  const row = await db
    .prepare("SELECT bi.* FROM backlog_items bi JOIN boards b ON bi.board_id = b.id WHERE bi.id = ? AND b.owner_id = ?")
    .bind(id, ownerId)
    .first<BacklogItem>();
  if (!row) throw new HTTPException(404, { message: "Backlog item not found" });
  return row;
}
