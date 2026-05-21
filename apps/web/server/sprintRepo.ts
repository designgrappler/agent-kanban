import type { Sprint, SprintStatus } from "@agent-kanban/shared";
import { HTTPException } from "hono/http-exception";
import { type D1, newId } from "./db";

export async function createSprint(db: D1, input: { boardId: string; theme: string; createdBy?: string | null }): Promise<Sprint> {
  const id = newId();
  const now = new Date().toISOString();
  const createdBy = input.createdBy ?? null;

  // Atomically allocate the next number for this board within a single statement
  // to avoid race conditions across concurrent inserts. The UNIQUE(board_id, number)
  // constraint provides the final safety net.
  const inserted = await db
    .prepare(
      `INSERT INTO sprints (id, board_id, number, theme, status, opened_at, closed_at, created_by)
       SELECT ?, ?, COALESCE((SELECT MAX(number) FROM sprints WHERE board_id = ?), 0) + 1, ?, 'planning', ?, NULL, ?
       RETURNING *`,
    )
    .bind(id, input.boardId, input.boardId, input.theme, now, createdBy)
    .first<Sprint>();

  if (!inserted) throw new HTTPException(500, { message: "Failed to create sprint" });
  return inserted;
}

export async function getSprint(db: D1, sprintId: string): Promise<Sprint | null> {
  const sprint = await db.prepare("SELECT * FROM sprints WHERE id = ?").bind(sprintId).first<Sprint>();
  return sprint ?? null;
}

export async function listSprintsByBoard(db: D1, boardId: string, opts?: { status?: SprintStatus }): Promise<Sprint[]> {
  if (opts?.status) {
    const result = await db
      .prepare("SELECT * FROM sprints WHERE board_id = ? AND status = ? ORDER BY number DESC")
      .bind(boardId, opts.status)
      .all<Sprint>();
    return result.results;
  }
  const result = await db.prepare("SELECT * FROM sprints WHERE board_id = ? ORDER BY number DESC").bind(boardId).all<Sprint>();
  return result.results;
}

export async function getActiveSprint(db: D1, boardId: string): Promise<Sprint | null> {
  const sprint = await db.prepare("SELECT * FROM sprints WHERE board_id = ? AND status = 'active' LIMIT 1").bind(boardId).first<Sprint>();
  return sprint ?? null;
}

function isValidTransition(from: SprintStatus, to: SprintStatus): boolean {
  if (from === "planning" && to === "active") return true;
  if (from === "active" && to === "closed") return true;
  if (from === "planning" && to === "closed") return true;
  return false;
}

export async function transitionSprint(db: D1, sprintId: string, nextStatus: SprintStatus): Promise<Sprint | null> {
  const sprint = await getSprint(db, sprintId);
  if (!sprint) return null;

  if (sprint.status === nextStatus) return sprint;

  if (!isValidTransition(sprint.status, nextStatus)) {
    throw new HTTPException(400, {
      message: `Invalid sprint status transition: ${sprint.status} → ${nextStatus}`,
    });
  }

  if (nextStatus === "active") {
    const existingActive = await db
      .prepare("SELECT id FROM sprints WHERE board_id = ? AND status = 'active' AND id != ?")
      .bind(sprint.board_id, sprintId)
      .first<{ id: string }>();
    if (existingActive) {
      throw new HTTPException(400, {
        message: "Another sprint on this board is already active",
      });
    }
  }

  const closedAt = nextStatus === "closed" ? new Date().toISOString() : null;
  await db.prepare("UPDATE sprints SET status = ?, closed_at = COALESCE(?, closed_at) WHERE id = ?").bind(nextStatus, closedAt, sprintId).run();

  return getSprint(db, sprintId);
}

export async function assertSprintOwner(db: D1, sprintId: string, ownerId: string): Promise<void> {
  const row = await db
    .prepare("SELECT 1 FROM sprints s JOIN boards b ON s.board_id = b.id WHERE s.id = ? AND b.owner_id = ?")
    .bind(sprintId, ownerId)
    .first();
  if (!row) throw new HTTPException(404, { message: "Sprint not found" });
}

export async function assertBoardOwner(db: D1, boardId: string, ownerId: string): Promise<void> {
  const row = await db.prepare("SELECT 1 FROM boards WHERE id = ? AND owner_id = ?").bind(boardId, ownerId).first();
  if (!row) throw new HTTPException(404, { message: "Board not found" });
}
