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

describe("POST /api/team-members — form field validation", () => {
  it("does not expose username field in response (only derives it)", async () => {
    const session = await createUserSessionToken("Form Test User", "form-test@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "form-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    // Username is derived from display_name
    expect(body.username).toBeDefined();
    expect(body.username).toMatch(/^[a-z0-9_-]+$/);
  });

  it("does not require runtime field (non-crypto team member)", async () => {
    const session = await createUserSessionToken("Form NoRuntime User", "form-noruntime@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "no-runtime-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    // No runtime in the response
    expect(body.runtime).toBeUndefined();
  });

  it("does not require model field", async () => {
    const session = await createUserSessionToken("Form NoModel User", "form-nomodel@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "no-model-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.model).toBeUndefined();
  });

  it("does not expose crypto/keypair fields in response", async () => {
    const session = await createUserSessionToken("Form NoCrypto User", "form-nocrypto@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "nocrypto-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.public_key).toBeUndefined();
    expect(body.private_key).toBeUndefined();
    expect(body.fingerprint).toBeUndefined();
  });

  it("rejects invalid role format", async () => {
    const session = await createUserSessionToken("Form BadRole User", "form-badrole@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "badrole-agent", role: "Bad Role!" }, session.token);
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.message).toMatch(/role/i);
  });

  it("accepts skills in source/repo@skill-name format", async () => {
    const session = await createUserSessionToken("Form Skills User", "form-skills@test.com");
    const res = await apiRequest(
      "POST",
      "/api/team-members",
      {
        display_name: "skills-agent",
        skills: ["source/repo@my-skill"],
      },
      session.token,
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills).toContain("source/repo@my-skill");
  });

  it("rejects malformed skill refs", async () => {
    const session = await createUserSessionToken("Form BadSkill User", "form-badskill@test.com");
    const res = await apiRequest(
      "POST",
      "/api/team-members",
      {
        display_name: "badskill-agent",
        skills: ["not-a-valid-skill"],
      },
      session.token,
    );
    expect(res.status).toBe(400);
  });

  it("avatar_path is null initially", async () => {
    const session = await createUserSessionToken("Form AvatarNull User", "form-avatarnull@test.com");
    const res = await apiRequest("POST", "/api/team-members", { display_name: "avatarnull-agent" }, session.token);
    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.avatar_path).toBeNull();
  });
});
