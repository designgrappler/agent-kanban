// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, setupMiniflare, signUpVerifiedUser } from "./helpers/db";

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

describe("POST /api/team-members", () => {
  it("creates a team member with required fields", async () => {
    const session = await createUserSessionToken("TM Create User", "tm-create@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "my-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.display_name).toBe("my-agent");
    expect(body.username).toBe("my-agent");
    expect(body.owner_id).toBe(session.userId);
  });

  it("auto-derives username from display_name with special chars", async () => {
    const session = await createUserSessionToken("TM Derive User", "tm-derive@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "My Agent 2" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    // Spaces become hyphens, lowercase, special chars stripped
    expect(body.username).toMatch(/^[a-z0-9_-]+$/);
  });

  it("returns 409 on duplicate username", async () => {
    const session = await createUserSessionToken("TM Dup User", "tm-dup-create@test.com");
    await apiRequest("POST", "/api/team-members", { display_name: "unique-agent" }, session.token);
    const res2 = await apiRequest("POST", "/api/team-members", { display_name: "unique-agent" }, session.token);
    expect(res2.status).toBe(409);
  });

  it("returns 400 when display_name is missing", async () => {
    const session = await createUserSessionToken("TM NoName User", "tm-noname@test.com");
    const res = await apiRequest("POST", "/api/team-members", { role: "specialist" }, session.token);
    expect(res.status).toBe(400);
  });

  it("returns 401 for unauthenticated request", async () => {
    const res = await apiRequest("POST", "/api/team-members", { display_name: "anon" });
    expect(res.status).toBe(401);
  });

  it("persists all Agent OS template fields", async () => {
    const session = await createUserSessionToken("TM Fields User", "tm-fields@test.com");
    const payload = {
      display_name: "full-agent",
      role: "specialist",
      bio: "A test bio",
      soul: "A test soul prompt",
      capabilities: ["Read", "Write"],
      handoff_to: ["bandit"],
      skills: ["source/repo@skill"],
    };
    const res = await apiRequest("POST", "/api/team-members", payload, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.role).toBe("specialist");
    expect(body.bio).toBe("A test bio");
    expect(body.soul).toBe("A test soul prompt");
    expect(Array.isArray(body.capabilities)).toBe(true);
    expect(body.capabilities).toContain("Read");
    expect(Array.isArray(body.handoff_to)).toBe(true);
    expect(body.handoff_to).toContain("bandit");
    expect(Array.isArray(body.skills)).toBe(true);
  });
});

describe("POST /api/team-members/:username/avatar — validation", () => {
  it("returns 400 when no file is provided", async () => {
    const session = await createUserSessionToken("TM Avatar No File", "tm-avatar-nofile@test.com");

    // First create a team member
    const createRes = await apiRequest("POST", "/api/team-members", { display_name: "avatar-test-member" }, session.token);
    expect(createRes.status).toBe(201);

    // Then attempt avatar upload with no file — needs multipart, so build FormData manually
    const { api } = await import("../apps/web/server/routes");
    const form = new FormData();
    // Intentionally omit the avatar field
    const res = await api.request(
      "/api/team-members/avatar-test-member/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.message).toMatch(/avatar file is required/i);
  });

  it("returns 400 for disallowed MIME type (text/plain)", async () => {
    const session = await createUserSessionToken("TM MIME User", "tm-mime@test.com");

    const createRes = await apiRequest("POST", "/api/team-members", { display_name: "mime-test-member" }, session.token);
    expect(createRes.status).toBe(201);

    const { api } = await import("../apps/web/server/routes");
    const form = new FormData();
    const txtBlob = new Blob(["hello"], { type: "text/plain" });
    form.append("avatar", new File([txtBlob], "file.txt", { type: "text/plain" }));

    const res = await api.request(
      "/api/team-members/mime-test-member/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.message).toMatch(/unsupported mime type/i);
  });

  it("returns 413 for file exceeding 1 MB", async () => {
    const session = await createUserSessionToken("TM Size User", "tm-size@test.com");

    const createRes = await apiRequest("POST", "/api/team-members", { display_name: "size-test-member" }, session.token);
    expect(createRes.status).toBe(201);

    const { api } = await import("../apps/web/server/routes");
    const form = new FormData();
    // 2 MB of data
    const bigBuffer = new Uint8Array(2 * 1024 * 1024);
    form.append("avatar", new File([bigBuffer], "big.png", { type: "image/png" }));

    const res = await api.request(
      "/api/team-members/size-test-member/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(413);
    const body = (await res.json()) as any;
    expect(body.error.message).toMatch(/too large/i);
  });

  it("returns 404 for unknown username", async () => {
    const session = await createUserSessionToken("TM Avatar 404 User", "tm-avatar-404@test.com");

    const { api } = await import("../apps/web/server/routes");
    const form = new FormData();
    const pngBlob = new Uint8Array([137, 80, 78, 71]); // PNG header
    form.append("avatar", new File([pngBlob], "test.png", { type: "image/png" }));

    const res = await api.request(
      "/api/team-members/does-not-exist/avatar",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: form,
      },
      env,
    );
    expect(res.status).toBe(404);
  });
});
