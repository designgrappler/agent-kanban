// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, seedUser, setupMiniflare } from "./helpers/db";

const env = createTestEnv();
let mf: Miniflare;

beforeAll(async () => {
  ({ mf, db: env.DB } = await setupMiniflare());
  await seedUser(env.DB, "sprint-test-user", "sprint@test.com");
  await seedUser(env.DB, "sprint-test-user-2", "sprint2@test.com");
});

afterAll(async () => {
  await mf.dispose();
});

async function makeBoard(ownerId: string, name: string) {
  const { createBoard } = await import("../apps/web/server/boardRepo");
  return createBoard(env.DB, ownerId, name, "dev");
}

describe("sprintRepo", () => {
  it("createSprint assigns number 1 for first sprint on a board", async () => {
    const { createSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Sprint Board 1");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "Theme A", createdBy: "sprint-test-user" });
    expect(sprint.number).toBe(1);
    expect(sprint.theme).toBe("Theme A");
    expect(sprint.status).toBe("planning");
    expect(sprint.board_id).toBe(board.id);
    expect(sprint.created_by).toBe("sprint-test-user");
    expect(sprint.closed_at).toBeNull();
  });

  it("createSprint auto-increments number per board", async () => {
    const { createSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Sprint Board 2");
    const s1 = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    const s2 = await createSprint(env.DB, { boardId: board.id, theme: "B" });
    const s3 = await createSprint(env.DB, { boardId: board.id, theme: "C" });
    expect(s1.number).toBe(1);
    expect(s2.number).toBe(2);
    expect(s3.number).toBe(3);
  });

  it("createSprint numbering is independent across boards", async () => {
    const { createSprint } = await import("../apps/web/server/sprintRepo");
    const boardA = await makeBoard("sprint-test-user", "Iso Board A");
    const boardB = await makeBoard("sprint-test-user", "Iso Board B");
    const a1 = await createSprint(env.DB, { boardId: boardA.id, theme: "x" });
    const b1 = await createSprint(env.DB, { boardId: boardB.id, theme: "y" });
    expect(a1.number).toBe(1);
    expect(b1.number).toBe(1);
  });

  it("concurrent createSprint produces distinct numbers", async () => {
    const { createSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Concurrent Board");
    const [s1, s2] = await Promise.all([
      createSprint(env.DB, { boardId: board.id, theme: "1" }),
      createSprint(env.DB, { boardId: board.id, theme: "2" }),
    ]);
    const numbers = [s1.number, s2.number].sort((a, b) => a - b);
    expect(numbers).toEqual([1, 2]);
  });

  it("getSprint returns the sprint by id, null otherwise", async () => {
    const { createSprint, getSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Get Sprint Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "G" });
    expect((await getSprint(env.DB, sprint.id))!.id).toBe(sprint.id);
    expect(await getSprint(env.DB, "nonexistent")).toBeNull();
  });

  it("listSprintsByBoard orders by number DESC", async () => {
    const { createSprint, listSprintsByBoard } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "List Sprints Board");
    await createSprint(env.DB, { boardId: board.id, theme: "1" });
    await createSprint(env.DB, { boardId: board.id, theme: "2" });
    await createSprint(env.DB, { boardId: board.id, theme: "3" });
    const sprints = await listSprintsByBoard(env.DB, board.id);
    expect(sprints.map((s) => s.number)).toEqual([3, 2, 1]);
  });

  it("listSprintsByBoard filters by status", async () => {
    const { createSprint, listSprintsByBoard, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Filter Sprints Board");
    const s1 = await createSprint(env.DB, { boardId: board.id, theme: "1" });
    await createSprint(env.DB, { boardId: board.id, theme: "2" });
    await transitionSprint(env.DB, s1.id, "active");
    const planning = await listSprintsByBoard(env.DB, board.id, { status: "planning" });
    const active = await listSprintsByBoard(env.DB, board.id, { status: "active" });
    expect(planning).toHaveLength(1);
    expect(active).toHaveLength(1);
    expect(active[0]!.id).toBe(s1.id);
  });

  it("getActiveSprint returns null when no active sprint exists", async () => {
    const { getActiveSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Active None Board");
    expect(await getActiveSprint(env.DB, board.id)).toBeNull();
  });

  it("getActiveSprint returns the active sprint when one exists", async () => {
    const { createSprint, getActiveSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Active One Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await transitionSprint(env.DB, sprint.id, "active");
    const active = await getActiveSprint(env.DB, board.id);
    expect(active!.id).toBe(sprint.id);
    expect(active!.status).toBe("active");
  });

  it("transitionSprint allows planning -> active", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans 1 Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    const updated = await transitionSprint(env.DB, sprint.id, "active");
    expect(updated!.status).toBe("active");
    expect(updated!.closed_at).toBeNull();
  });

  it("transitionSprint allows active -> closed and sets closed_at", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans 2 Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await transitionSprint(env.DB, sprint.id, "active");
    const closed = await transitionSprint(env.DB, sprint.id, "closed");
    expect(closed!.status).toBe("closed");
    expect(closed!.closed_at).not.toBeNull();
  });

  it("transitionSprint allows planning -> closed (cancelled-before-start)", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans 3 Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    const closed = await transitionSprint(env.DB, sprint.id, "closed");
    expect(closed!.status).toBe("closed");
    expect(closed!.closed_at).not.toBeNull();
  });

  it("transitionSprint rejects active -> planning", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans Reject 1 Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await transitionSprint(env.DB, sprint.id, "active");
    await expect(transitionSprint(env.DB, sprint.id, "planning")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("transitionSprint rejects closed -> active", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans Reject 2 Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await transitionSprint(env.DB, sprint.id, "active");
    await transitionSprint(env.DB, sprint.id, "closed");
    await expect(transitionSprint(env.DB, sprint.id, "active")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("transitionSprint rejects activating a second sprint when one is already active", async () => {
    const { createSprint, transitionSprint } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Trans Active Conflict Board");
    const s1 = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    const s2 = await createSprint(env.DB, { boardId: board.id, theme: "B" });
    await transitionSprint(env.DB, s1.id, "active");
    await expect(transitionSprint(env.DB, s2.id, "active")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("transitionSprint returns null for unknown sprint id", async () => {
    const { transitionSprint } = await import("../apps/web/server/sprintRepo");
    expect(await transitionSprint(env.DB, "nonexistent", "active")).toBeNull();
  });

  it("assertSprintOwner throws 404 when sprint does not exist", async () => {
    const { assertSprintOwner } = await import("../apps/web/server/sprintRepo");
    await expect(assertSprintOwner(env.DB, "nonexistent", "sprint-test-user")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("assertSprintOwner throws 404 when owner_id mismatches", async () => {
    const { createSprint, assertSprintOwner } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Owner Scope Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await expect(assertSprintOwner(env.DB, sprint.id, "sprint-test-user-2")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("assertSprintOwner succeeds when owner matches", async () => {
    const { createSprint, assertSprintOwner } = await import("../apps/web/server/sprintRepo");
    const board = await makeBoard("sprint-test-user", "Owner Match Board");
    const sprint = await createSprint(env.DB, { boardId: board.id, theme: "A" });
    await expect(assertSprintOwner(env.DB, sprint.id, "sprint-test-user")).resolves.toBeUndefined();
  });
});
