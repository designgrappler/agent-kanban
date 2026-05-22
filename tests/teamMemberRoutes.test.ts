// @vitest-environment node

import { BUILTIN_TEAM_MEMBERS } from "@agent-kanban/shared";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, seedUser, setupMiniflare, signUpVerifiedUser } from "./helpers/db";

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

async function createUserSessionToken(name: string, email: string): Promise<{ token: string; userId: string }> {
  const { createAuth } = await import("../apps/web/server/betterAuth");
  const auth = createAuth(env);
  const result = await signUpVerifiedUser(env.DB, auth, { name, email, password: "test-password-123" });
  return { token: result.token, userId: result.user.id };
}

beforeAll(async () => {
  ({ mf, db: env.DB } = await setupMiniflare());
});

afterAll(async () => {
  await mf.dispose();
});

describe("GET /api/team-members", () => {
  it("returns 401 for missing token", async () => {
    const res = await apiRequest("GET", "/api/team-members");
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns the three builtin team members for an authenticated user", async () => {
    const session = await createUserSessionToken("TM Routes User", "tm-routes-user@test.com");

    // Trigger the new-owner bootstrap by creating a board (mirrors the
    // flow seedBuiltinTeamMembers is wired into).
    const { createBoard } = await import("../apps/web/server/boardRepo");
    await createBoard(env.DB, session.userId, "TM Routes Board", "dev");

    const res = await apiRequest("GET", "/api/team-members", undefined, session.token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any[];
    expect(body).toHaveLength(BUILTIN_TEAM_MEMBERS.length);
    const usernames = body.map((m) => m.username).sort();
    expect(usernames).toEqual(["bandit", "peaches", "skylar"]);

    // Owner-scoped fields are populated
    const peaches = body.find((m) => m.username === "peaches");
    expect(peaches.role).toBe("architect");
    expect(peaches.builtin).toBe(1);
    expect(Array.isArray(peaches.capabilities)).toBe(true);
    expect(peaches.md_path).toBe(".claude/agents/peaches.md");
  });

  it("authenticates with API key (machine identity)", async () => {
    const userId = "tm-routes-machine-user";
    await seedUser(env.DB, userId, "tm-machine@test.com");
    const apiKey = await createApiKeyForUser(userId);

    const { createBoard } = await import("../apps/web/server/boardRepo");
    await createBoard(env.DB, userId, "TM Machine Board", "ops");

    const res = await apiRequest("GET", "/api/team-members", undefined, apiKey);
    expect(res.status).toBe(200);
  });

  it("returns owner-scoped rows only — second user with no board sees zero", async () => {
    const session = await createUserSessionToken("TM Empty User", "tm-empty@test.com");
    const res = await apiRequest("GET", "/api/team-members", undefined, session.token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any[];
    expect(body).toEqual([]);
  });
});

describe("GET /api/team-members/:username", () => {
  it("returns 200 for an existing builtin", async () => {
    const session = await createUserSessionToken("TM Detail User", "tm-detail@test.com");
    const { createBoard } = await import("../apps/web/server/boardRepo");
    await createBoard(env.DB, session.userId, "TM Detail Board", "dev");

    const res = await apiRequest("GET", "/api/team-members/peaches", undefined, session.token);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.username).toBe("peaches");
    expect(body.role).toBe("architect");
  });

  it("returns 404 for unknown username", async () => {
    const session = await createUserSessionToken("TM 404 User", "tm-404@test.com");
    const res = await apiRequest("GET", "/api/team-members/does-not-exist", undefined, session.token);
    expect(res.status).toBe(404);
  });
});
