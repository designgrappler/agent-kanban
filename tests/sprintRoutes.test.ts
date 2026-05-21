// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, seedUser, setupMiniflare } from "./helpers/db";

const env = createTestEnv();
let mf: Miniflare;

async function apiRequest(method: string, path: string, body?: unknown, token?: string) {
  const { api } = await import("../apps/web/server/routes");
  const headers: Record<string, string> = { "Content-Type": "application/json", Host: "localhost:8788", "x-forwarded-proto": "http" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") init.body = JSON.stringify(body);
  return api.request(path, init, env);
}

async function createApiKeyForUser(userId: string): Promise<string> {
  const { createAuth } = await import("../apps/web/server/betterAuth");
  const auth = createAuth(env);
  const result = await auth.api.createApiKey({ body: { userId } });
  return result.key;
}

describe("sprint routes", () => {
  const userId = "sprint-routes-user";
  const otherUserId = "sprint-routes-other-user";
  let apiKey: string;
  let otherApiKey: string;
  let boardId: string;
  let otherBoardId: string;

  beforeAll(async () => {
    ({ mf, db: env.DB } = await setupMiniflare());
    await seedUser(env.DB, userId, "sprint-routes@test.com");
    await seedUser(env.DB, otherUserId, "sprint-routes-other@test.com");
    apiKey = await createApiKeyForUser(userId);
    otherApiKey = await createApiKeyForUser(otherUserId);

    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Sprint Routes Board", "ops");
    boardId = board.id;
    const otherBoard = await createBoard(env.DB, otherUserId, "Other Sprint Routes Board", "ops");
    otherBoardId = otherBoard.id;
  });

  afterAll(async () => {
    await mf.dispose();
  });

  it("POST /api/boards/:id/sprints creates a sprint", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/sprints`, { theme: "Foundation" }, apiKey);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.id).toBeDefined();
    expect(body.board_id).toBe(boardId);
    expect(body.number).toBe(1);
    expect(body.theme).toBe("Foundation");
    expect(body.status).toBe("planning");
  });

  it("POST /api/boards/:id/sprints returns 400 when theme is missing", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/sprints`, {}, apiKey);
    expect(res.status).toBe(400);
  });

  it("POST /api/boards/:id/sprints returns 400 when theme is empty", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/sprints`, { theme: "  " }, apiKey);
    expect(res.status).toBe(400);
  });

  it("POST /api/boards/:id/sprints returns 404 for board owned by another user", async () => {
    const res = await apiRequest("POST", `/api/boards/${otherBoardId}/sprints`, { theme: "X" }, apiKey);
    expect(res.status).toBe(404);
  });

  it("GET /api/boards/:id/sprints lists sprints in number DESC order", async () => {
    // Create a fresh board so order is predictable
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "List Order Board", "ops");
    await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "1" }, apiKey);
    await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "2" }, apiKey);
    await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "3" }, apiKey);

    const res = await apiRequest("GET", `/api/boards/${board.id}/sprints`, undefined, apiKey);
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list.map((s) => s.number)).toEqual([3, 2, 1]);
  });

  it("GET /api/boards/:id/sprints?status= filters by status", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Filter Status Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprintA = (await created.json()) as any;
    await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "B" }, apiKey);
    await apiRequest("PATCH", `/api/sprints/${sprintA.id}`, { status: "active" }, apiKey);

    const res = await apiRequest("GET", `/api/boards/${board.id}/sprints?status=planning`, undefined, apiKey);
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list).toHaveLength(1);
    expect(list[0].theme).toBe("B");
  });

  it("GET /api/boards/:id/sprints?status= returns 400 for invalid status", async () => {
    const res = await apiRequest("GET", `/api/boards/${boardId}/sprints?status=bogus`, undefined, apiKey);
    expect(res.status).toBe(400);
  });

  it("GET /api/boards/:id/sprints/active returns 404 when none active", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "No Active Board", "ops");
    await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);

    const res = await apiRequest("GET", `/api/boards/${board.id}/sprints/active`, undefined, apiKey);
    expect(res.status).toBe(404);
  });

  it("GET /api/boards/:id/sprints/active returns the active sprint", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Has Active Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprint = (await created.json()) as any;
    await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "active" }, apiKey);

    const res = await apiRequest("GET", `/api/boards/${board.id}/sprints/active`, undefined, apiKey);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBe(sprint.id);
    expect(body.status).toBe("active");
  });

  it("GET /api/sprints/:id returns the sprint when owned", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Get Sprint Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "G" }, apiKey);
    const sprint = (await created.json()) as any;

    const res = await apiRequest("GET", `/api/sprints/${sprint.id}`, undefined, apiKey);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBe(sprint.id);
  });

  it("GET /api/sprints/:id returns 404 when accessed by a different owner", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Cross Owner Get Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "X" }, apiKey);
    const sprint = (await created.json()) as any;

    const res = await apiRequest("GET", `/api/sprints/${sprint.id}`, undefined, otherApiKey);
    expect(res.status).toBe(404);
  });

  it("PATCH /api/sprints/:id transitions planning -> active", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Patch Activate Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprint = (await created.json()) as any;

    const res = await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "active" }, apiKey);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("active");
  });

  it("PATCH /api/sprints/:id rejects active -> planning with 400", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Reject Patch Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprint = (await created.json()) as any;
    await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "active" }, apiKey);

    const res = await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "planning" }, apiKey);
    expect(res.status).toBe(400);
  });

  it("PATCH /api/sprints/:id returns 400 for invalid status", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Invalid Status Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprint = (await created.json()) as any;

    const res = await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "bogus" }, apiKey);
    expect(res.status).toBe(400);
  });

  it("PATCH /api/sprints/:id returns 404 when accessed by a different owner", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userId, "Cross Owner Patch Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${board.id}/sprints`, { theme: "A" }, apiKey);
    const sprint = (await created.json()) as any;

    const res = await apiRequest("PATCH", `/api/sprints/${sprint.id}`, { status: "active" }, otherApiKey);
    expect(res.status).toBe(404);
  });
});
