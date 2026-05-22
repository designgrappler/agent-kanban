// @vitest-environment node

import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestAgent, createTestEnv, seedUser, setupMiniflare, signUpVerifiedUser } from "./helpers/db";

const BETTER_AUTH_URL = "http://localhost:8788";
const env = createTestEnv();
let mf: Miniflare;

async function apiRequest(method: string, path: string, body?: unknown, token?: string) {
  const { api } = await import("../apps/web/server/routes");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Host: "localhost:8788",
    "x-forwarded-proto": "http",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") init.body = JSON.stringify(body);
  return api.request(path, init, env);
}

describe("backlog item routes", () => {
  const userId = "backlog-routes-user";
  let userToken: string;
  let userOwnerId: string;
  let boardId: string;
  let otherBoardId: string;
  let workerAgentId: string;
  let workerSessionId: string;
  let workerSessionPrivateKey: CryptoKey;
  let leaderAgentId: string;
  let leaderSessionId: string;
  let leaderSessionPrivateKey: CryptoKey;

  async function signWorkerJWT(): Promise<string> {
    return new SignJWT({ sub: workerSessionId, aid: workerAgentId, jti: randomUUID(), aud: BETTER_AUTH_URL })
      .setProtectedHeader({ alg: "EdDSA", typ: "agent+jwt" })
      .setIssuedAt()
      .setExpirationTime("60s")
      .sign(workerSessionPrivateKey);
  }

  async function signLeaderJWT(): Promise<string> {
    return new SignJWT({ sub: leaderSessionId, aid: leaderAgentId, jti: randomUUID(), aud: BETTER_AUTH_URL })
      .setProtectedHeader({ alg: "EdDSA", typ: "agent+jwt" })
      .setIssuedAt()
      .setExpirationTime("60s")
      .sign(leaderSessionPrivateKey);
  }

  beforeAll(async () => {
    ({ mf, db: env.DB } = await setupMiniflare());

    // Create primary verified user
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(env);
    const userResult = await signUpVerifiedUser(env.DB, auth, {
      name: "Backlog Routes User",
      email: "backlog-routes@test.com",
      password: "test-password-123",
    });
    userToken = userResult.token;
    userOwnerId = userResult.user.id;
    // Used as ownerId for agent identities and seeding
    await seedUser(env.DB, userId, "backlog-routes-extra@test.com");

    // API key for the same user (machine identity) for setting up agents/sessions
    const apiKeyResult = await auth.api.createApiKey({ body: { userId: userOwnerId } });
    const apiKey = apiKeyResult.key;

    // Register a machine — required before agent sessions can be created
    const machineRes = await apiRequest(
      "POST",
      "/api/machines",
      {
        name: "backlog-routes-machine",
        os: "darwin",
        version: "1.0.0",
        runtimes: [{ name: "claude", status: "ready", checked_at: "2026-03-21T10:00:00Z" }],
        device_id: "backlog-routes-device",
      },
      apiKey,
    );
    expect(machineRes.status).toBe(201);

    // Worker agent + session
    const workerAgent = await createTestAgent(env.DB, userOwnerId, {
      name: "Worker Agent",
      username: "backlog-worker",
      runtime: "claude",
    });
    workerAgentId = workerAgent.id;
    workerSessionId = randomUUID();
    const workerKp = await crypto.subtle.generateKey({ name: "Ed25519" } as any, true, ["sign", "verify"]);
    workerSessionPrivateKey = (workerKp as any).privateKey;
    const workerJwk = await crypto.subtle.exportKey("jwk", (workerKp as any).publicKey);
    await apiRequest("POST", `/api/agents/${workerAgentId}/sessions`, { session_id: workerSessionId, session_public_key: workerJwk.x! }, apiKey);

    // Leader agent + session
    const leaderAgent = await createTestAgent(env.DB, userOwnerId, {
      name: "Leader Agent",
      username: "backlog-leader",
      runtime: "claude",
      kind: "leader",
    });
    leaderAgentId = leaderAgent.id;
    leaderSessionId = randomUUID();
    const leaderKp = await crypto.subtle.generateKey({ name: "Ed25519" } as any, true, ["sign", "verify"]);
    leaderSessionPrivateKey = (leaderKp as any).privateKey;
    const leaderJwk = await crypto.subtle.exportKey("jwk", (leaderKp as any).publicKey);
    await apiRequest("POST", `/api/agents/${leaderAgentId}/sessions`, { session_id: leaderSessionId, session_public_key: leaderJwk.x! }, apiKey);

    // Create primary board owned by the user
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const board = await createBoard(env.DB, userOwnerId, "Backlog Board", "ops");
    boardId = board.id;

    const otherBoard = await createBoard(env.DB, userId, "Other Backlog Board", "ops");
    otherBoardId = otherBoard.id;
  });

  afterAll(async () => {
    await mf.dispose();
  });

  // ─── Auth ───

  it("POST /api/boards/:id/backlog-items requires auth", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, {
      title: "anon",
      priority: "P1",
    });
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("POST /api/boards/:id/backlog-items rejects agent:worker with 403", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2" }, await signWorkerJWT());
    expect(res.status).toBe(403);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("POST /api/boards/:id/backlog-items allows agent:leader", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "leader idea", priority: "P1" }, await signLeaderJWT());
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.title).toBe("leader idea");
    expect(body.status).toBe("idea");
  });

  // ─── Create ───

  it("POST /api/boards/:id/backlog-items creates an item with defaults", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "First idea", priority: "P2" }, userToken);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.id).toBeDefined();
    expect(body.board_id).toBe(boardId);
    expect(body.title).toBe("First idea");
    expect(body.priority).toBe("P2");
    expect(body.status).toBe("idea");
    expect(body.description).toBeNull();
    expect(body.consumed_at).toBeNull();
  });

  it("POST /api/boards/:id/backlog-items returns 400 for missing title", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { priority: "P2" }, userToken);
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error).toBeDefined();
    expect(body.error.message).toBeDefined();
  });

  it("POST /api/boards/:id/backlog-items returns 400 for invalid priority", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P9" }, userToken);
    expect(res.status).toBe(400);
  });

  it("POST /api/boards/:id/backlog-items returns 400 for terminal status on create", async () => {
    const res = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2", status: "consumed" }, userToken);
    expect(res.status).toBe(400);
  });

  it("POST /api/boards/:id/backlog-items returns 404 for unknown board", async () => {
    const res = await apiRequest("POST", `/api/boards/no-such-board/backlog-items`, { title: "x", priority: "P2" }, userToken);
    expect(res.status).toBe(404);
  });

  it("POST /api/boards/:id/backlog-items returns 404 for board owned by another user", async () => {
    const res = await apiRequest("POST", `/api/boards/${otherBoardId}/backlog-items`, { title: "x", priority: "P2" }, userToken);
    expect(res.status).toBe(404);
  });

  // ─── List ───

  it("GET /api/boards/:id/backlog-items lists items, newest first", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const b = await createBoard(env.DB, userOwnerId, "List Board", "ops");
    await apiRequest("POST", `/api/boards/${b.id}/backlog-items`, { title: "1", priority: "P3" }, userToken);
    await new Promise((r) => setTimeout(r, 1100));
    await apiRequest("POST", `/api/boards/${b.id}/backlog-items`, { title: "2", priority: "P3" }, userToken);

    const res = await apiRequest("GET", `/api/boards/${b.id}/backlog-items`, undefined, userToken);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any[];
    expect(body.map((i) => i.title)).toEqual(["2", "1"]);
  });

  it("GET /api/boards/:id/backlog-items?status= filters by status", async () => {
    const { createBoard } = await import("../apps/web/server/boardRepo");
    const b = await createBoard(env.DB, userOwnerId, "Filter Board", "ops");
    const created = await apiRequest("POST", `/api/boards/${b.id}/backlog-items`, { title: "first", priority: "P1" }, userToken);
    const item = (await created.json()) as any;
    await apiRequest("POST", `/api/boards/${b.id}/backlog-items`, { title: "second", priority: "P2" }, userToken);
    await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { status: "consumed" }, userToken);

    const res = await apiRequest("GET", `/api/boards/${b.id}/backlog-items?status=consumed`, undefined, userToken);
    expect(res.status).toBe(200);
    const list = (await res.json()) as any[];
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(item.id);
  });

  it("GET /api/boards/:id/backlog-items returns 400 for invalid status filter", async () => {
    const res = await apiRequest("GET", `/api/boards/${boardId}/backlog-items?status=bogus`, undefined, userToken);
    expect(res.status).toBe(400);
  });

  // ─── Get single ───

  it("GET /api/backlog-items/:id returns the item for owner", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "find me", priority: "P0" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("GET", `/api/backlog-items/${item.id}`, undefined, userToken);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.id).toBe(item.id);
  });

  it("GET /api/backlog-items/:id returns 404 for unknown id", async () => {
    const res = await apiRequest("GET", "/api/backlog-items/no-such", undefined, userToken);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.error.message).toBeDefined();
  });

  // ─── Update ───

  it("PATCH /api/backlog-items/:id updates title, description and priority", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "to-edit", priority: "P3" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest(
      "PATCH",
      `/api/backlog-items/${item.id}`,
      { title: "edited", description: "now described", priority: "P0" },
      userToken,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.title).toBe("edited");
    expect(body.description).toBe("now described");
    expect(body.priority).toBe("P0");
  });

  it("PATCH /api/backlog-items/:id sets consumed_at when transitioning to consumed", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "to-consume", priority: "P2" }, userToken);
    const item = (await created.json()) as any;
    expect(item.consumed_at).toBeNull();
    const res = await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { status: "consumed" }, userToken);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("consumed");
    expect(body.consumed_at).not.toBeNull();
  });

  it("PATCH /api/backlog-items/:id returns 400 for invalid priority", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { priority: "P9" }, userToken);
    expect(res.status).toBe(400);
  });

  it("PATCH /api/backlog-items/:id returns 400 for invalid status", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { status: "bogus" }, userToken);
    expect(res.status).toBe(400);
  });

  it("PATCH /api/backlog-items/:id rejects agent:worker with 403", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { title: "renamed" }, await signWorkerJWT());
    expect(res.status).toBe(403);
  });

  it("PATCH /api/backlog-items/:id allows agent:leader", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P2" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("PATCH", `/api/backlog-items/${item.id}`, { title: "leader-edit" }, await signLeaderJWT());
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.title).toBe("leader-edit");
  });

  // ─── Delete ───

  it("DELETE /api/backlog-items/:id removes the item", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "to-delete", priority: "P3" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("DELETE", `/api/backlog-items/${item.id}`, undefined, userToken);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    const after = await apiRequest("GET", `/api/backlog-items/${item.id}`, undefined, userToken);
    expect(after.status).toBe(404);
  });

  it("DELETE /api/backlog-items/:id rejects agent:worker with 403", async () => {
    const created = await apiRequest("POST", `/api/boards/${boardId}/backlog-items`, { title: "x", priority: "P3" }, userToken);
    const item = (await created.json()) as any;
    const res = await apiRequest("DELETE", `/api/backlog-items/${item.id}`, undefined, await signWorkerJWT());
    expect(res.status).toBe(403);
  });

  it("DELETE /api/backlog-items/:id returns 404 for unknown id", async () => {
    const res = await apiRequest("DELETE", "/api/backlog-items/no-such", undefined, userToken);
    expect(res.status).toBe(404);
  });

  // ─── Error envelope shape ───

  it("error responses use { error: { code, message } } envelope", async () => {
    const res = await apiRequest("GET", "/api/backlog-items/no-such", undefined, userToken);
    const body = (await res.json()) as any;
    expect(body.error).toBeDefined();
    expect(typeof body.error.message).toBe("string");
  });
});
