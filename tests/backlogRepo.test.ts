// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, seedUser, setupMiniflare } from "./helpers/db";

const env = createTestEnv();
let mf: Miniflare;

beforeAll(async () => {
  ({ mf, db: env.DB } = await setupMiniflare());
  await seedUser(env.DB, "backlog-test-user", "backlog@test.com");
  await seedUser(env.DB, "backlog-test-user-2", "backlog2@test.com");
});

afterAll(async () => {
  await mf.dispose();
});

async function makeBoard(ownerId: string, name: string) {
  const { createBoard } = await import("../apps/web/server/boardRepo");
  return createBoard(env.DB, ownerId, name, "dev");
}

describe("backlogRepo", () => {
  it("createBacklogItem inserts a row with defaults", async () => {
    const { createBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board 1");
    const item = await createBacklogItem(env.DB, board.id, { title: "Idea one", priority: "P2" }, "backlog-test-user");
    expect(item.id).toBeDefined();
    expect(item.board_id).toBe(board.id);
    expect(item.title).toBe("Idea one");
    expect(item.description).toBeNull();
    expect(item.priority).toBe("P2");
    expect(item.status).toBe("idea");
    expect(item.created_by).toBe("backlog-test-user");
    expect(item.consumed_at).toBeNull();
    expect(item.consumed_into_task_id).toBeNull();
    expect(item.created_at).toBeTruthy();
    expect(item.updated_at).toBeTruthy();
  });

  it("createBacklogItem persists description and explicit in_planning status", async () => {
    const { createBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board 2");
    const item = await createBacklogItem(
      env.DB,
      board.id,
      { title: "With desc", description: "Hello", priority: "P0", status: "in_planning" },
      "backlog-test-user",
    );
    expect(item.description).toBe("Hello");
    expect(item.status).toBe("in_planning");
    expect(item.priority).toBe("P0");
  });

  it("getBacklogItem returns the row, or null when missing", async () => {
    const { createBacklogItem, getBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board 3");
    const created = await createBacklogItem(env.DB, board.id, { title: "Get me", priority: "P1" }, "backlog-test-user");
    const fetched = await getBacklogItem(env.DB, created.id);
    expect(fetched?.id).toBe(created.id);

    const missing = await getBacklogItem(env.DB, "no-such-id");
    expect(missing).toBeNull();
  });

  it("listBacklogItemsByBoard returns items filtered by board, newest first", async () => {
    const { createBacklogItem, listBacklogItemsByBoard } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board List");
    const a = await createBacklogItem(env.DB, board.id, { title: "A", priority: "P3" }, "backlog-test-user");
    // Ensure created_at differs by tiny gap so ordering is observable
    await new Promise((r) => setTimeout(r, 1100));
    const b = await createBacklogItem(env.DB, board.id, { title: "B", priority: "P2" }, "backlog-test-user");

    const list = await listBacklogItemsByBoard(env.DB, board.id);
    expect(list.length).toBe(2);
    expect(list[0].id).toBe(b.id);
    expect(list[1].id).toBe(a.id);
  });

  it("listBacklogItemsByBoard filters by status", async () => {
    const { createBacklogItem, listBacklogItemsByBoard } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Filter");
    const idea = await createBacklogItem(env.DB, board.id, { title: "I", priority: "P1" }, "backlog-test-user");
    const planning = await createBacklogItem(env.DB, board.id, { title: "P", priority: "P1", status: "in_planning" }, "backlog-test-user");

    const onlyIdea = await listBacklogItemsByBoard(env.DB, board.id, { status: "idea" });
    expect(onlyIdea.map((i) => i.id)).toEqual([idea.id]);

    const onlyPlanning = await listBacklogItemsByBoard(env.DB, board.id, { status: "in_planning" });
    expect(onlyPlanning.map((i) => i.id)).toEqual([planning.id]);
  });

  it("updateBacklogItem updates title, description, and priority and bumps updated_at", async () => {
    const { createBacklogItem, updateBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Update");
    const item = await createBacklogItem(env.DB, board.id, { title: "Original", priority: "P3" }, "backlog-test-user");
    await new Promise((r) => setTimeout(r, 1100));
    const updated = await updateBacklogItem(env.DB, item.id, {
      title: "Renamed",
      description: "now described",
      priority: "P0",
    });
    expect(updated.title).toBe("Renamed");
    expect(updated.description).toBe("now described");
    expect(updated.priority).toBe("P0");
    expect(updated.updated_at >= item.updated_at).toBe(true);
    expect(updated.consumed_at).toBeNull();
  });

  it("updateBacklogItem can set description back to null", async () => {
    const { createBacklogItem, updateBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Null Desc");
    const item = await createBacklogItem(env.DB, board.id, { title: "T", description: "x", priority: "P2" }, "backlog-test-user");
    const updated = await updateBacklogItem(env.DB, item.id, { description: null });
    expect(updated.description).toBeNull();
  });

  it("updateBacklogItem to status 'consumed' sets consumed_at", async () => {
    const { createBacklogItem, updateBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Consume");
    const item = await createBacklogItem(env.DB, board.id, { title: "Consume me", priority: "P1" }, "backlog-test-user");
    expect(item.consumed_at).toBeNull();
    const consumed = await updateBacklogItem(env.DB, item.id, { status: "consumed" });
    expect(consumed.status).toBe("consumed");
    expect(consumed.consumed_at).not.toBeNull();
  });

  it("updateBacklogItem to status 'dropped' does not set consumed_at", async () => {
    const { createBacklogItem, updateBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Dropped");
    const item = await createBacklogItem(env.DB, board.id, { title: "Drop me", priority: "P3" }, "backlog-test-user");
    const dropped = await updateBacklogItem(env.DB, item.id, { status: "dropped" });
    expect(dropped.status).toBe("dropped");
    expect(dropped.consumed_at).toBeNull();
  });

  it("updateBacklogItem throws 404 for unknown id", async () => {
    const { updateBacklogItem } = await import("../apps/web/server/backlogRepo");
    await expect(updateBacklogItem(env.DB, "no-such-id", { title: "x" })).rejects.toThrow();
  });

  it("deleteBacklogItem removes the row", async () => {
    const { createBacklogItem, deleteBacklogItem, getBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Delete");
    const item = await createBacklogItem(env.DB, board.id, { title: "Goodbye", priority: "P3" }, "backlog-test-user");
    await deleteBacklogItem(env.DB, item.id);
    expect(await getBacklogItem(env.DB, item.id)).toBeNull();
  });

  it("assertBoardOwnerForBacklog throws 404 when board not owned", async () => {
    const { assertBoardOwnerForBacklog } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Owner");
    await expect(assertBoardOwnerForBacklog(env.DB, board.id, "backlog-test-user-2")).rejects.toThrow();
    // happy path does not throw
    await assertBoardOwnerForBacklog(env.DB, board.id, "backlog-test-user");
  });

  it("assertBacklogItemOwner returns row for owner, throws for non-owner", async () => {
    const { assertBacklogItemOwner, createBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Item Owner");
    const item = await createBacklogItem(env.DB, board.id, { title: "Owned", priority: "P2" }, "backlog-test-user");
    const row = await assertBacklogItemOwner(env.DB, item.id, "backlog-test-user");
    expect(row.id).toBe(item.id);
    await expect(assertBacklogItemOwner(env.DB, item.id, "backlog-test-user-2")).rejects.toThrow();
    await expect(assertBacklogItemOwner(env.DB, "no-such", "backlog-test-user")).rejects.toThrow();
  });

  it("backlog_items cascade deletes when board deleted", async () => {
    const { createBacklogItem, getBacklogItem } = await import("../apps/web/server/backlogRepo");
    const board = await makeBoard("backlog-test-user", "BR Board Cascade");
    const item = await createBacklogItem(env.DB, board.id, { title: "Cascade", priority: "P1" }, "backlog-test-user");
    await env.DB.prepare("DELETE FROM boards WHERE id = ?").bind(board.id).run();
    expect(await getBacklogItem(env.DB, item.id)).toBeNull();
  });
});
