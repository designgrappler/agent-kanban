// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestEnv, seedUser, setupMiniflare, signUpVerifiedUser } from "./helpers/db";

// ─── metricsMiddleware unit tests ───

describe("metricsMiddleware", () => {
  it("calls next() and does not call writeDataPoint (no-op middleware)", async () => {
    const { metricsMiddleware } = await import("../apps/web/server/metrics");

    let nextCalled = false;
    const writeDataPoint = vi.fn();
    const c = {
      env: { AE: { writeDataPoint } },
      get: (key: string) => {
        if (key === "machineId") return "machine-abc";
        if (key === "identityType") return "machine";
        return undefined;
      },
      req: { method: "GET", path: "/api/machines" },
      res: { status: 200 },
    } as any;

    await metricsMiddleware(c, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(writeDataPoint).not.toHaveBeenCalled();
  });
});

// ─── GET /api/admin/machines route tests ───

const routeEnv = createTestEnv();
let mf: Miniflare;

async function apiRequest(method: string, path: string, body?: Record<string, unknown>, token?: string) {
  const { api } = await import("../apps/web/server/routes");
  const headers: Record<string, string> = { "Content-Type": "application/json", Host: "localhost:8788", "x-forwarded-proto": "http" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const init: RequestInit = { method, headers };
  if (body && method !== "GET") init.body = JSON.stringify(body);
  return api.request(path, init, routeEnv);
}

beforeAll(async () => {
  ({ mf, db: routeEnv.DB } = await setupMiniflare());
});

afterAll(async () => {
  await mf.dispose();
});

describe("GET /api/admin/machines", () => {
  let adminToken: string;
  let regularToken: string;

  beforeAll(async () => {
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(routeEnv);

    const adminResult = await signUpVerifiedUser(
      routeEnv.DB,
      auth,
      { name: "Admin Machines User", email: "admin-machines@test.com", password: "admin-password-123" },
      "admin",
    );
    adminToken = adminResult.token;

    const regularResult = await signUpVerifiedUser(routeEnv.DB, auth, {
      name: "Regular Machines User",
      email: "regular-machines@test.com",
      password: "regular-password-123",
    });
    regularToken = regularResult.token;
  });

  it("returns 401 when no token is provided", async () => {
    const res = await apiRequest("GET", "/api/admin/machines");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a regular (non-admin) user", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, regularToken);
    expect(res.status).toBe(403);
  });

  it("returns FORBIDDEN error code for a non-admin user", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, regularToken);
    const body = (await res.json()) as any;
    expect(body.error?.code).toBe("FORBIDDEN");
  });

  it("returns 200 for an admin user", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    expect(res.status).toBe(200);
  });

  it("returns an array in the response body for admin", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    const body = (await res.json()) as any;
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns an empty array when no machines are registered", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    const body = (await res.json()) as any;
    expect(body).toHaveLength(0);
  });

  it("includes owner_name and owner_email on each machine entry", async () => {
    const ownerId = "admin-machines-owner";
    await seedUser(routeEnv.DB, ownerId, "machines-owner@test.com");
    const { upsertMachine } = await import("../apps/web/server/machineRepo");
    await upsertMachine(routeEnv.DB, ownerId, {
      name: "Test Machine",
      os: "linux",
      version: "1.0.0",
      runtimes: [{ name: "claude", status: "ready", checked_at: "2026-03-21T10:00:00Z" }],
      device_id: "device-admin-machines-test",
    });

    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    const body = (await res.json()) as any[];
    const machine = body.find((m) => m.name === "Test Machine");
    expect(machine).toBeDefined();
    expect(machine.owner_name).toBe("Test User");
    expect(machine.owner_email).toBe("machines-owner@test.com");
  });

  it("includes metrics field on each machine entry (null when no AE data)", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    const body = (await res.json()) as any[];
    for (const machine of body) {
      expect("metrics" in machine).toBe(true);
    }
  });

  it("parses runtimes as an array on each machine entry", async () => {
    const res = await apiRequest("GET", "/api/admin/machines", undefined, adminToken);
    const body = (await res.json()) as any[];
    const machine = body.find((m) => m.name === "Test Machine");
    expect(machine).toBeDefined();
    expect(Array.isArray(machine.runtimes)).toBe(true);
  });

  it("returns machine api key auth as 403", async () => {
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(routeEnv);
    const machineKeyResult = await auth.api.createApiKey({ body: { userId: "machine-key-for-admin-machines" } });
    const res = await apiRequest("GET", "/api/admin/machines", undefined, machineKeyResult.key);
    expect(res.status).toBe(403);
  });
});
