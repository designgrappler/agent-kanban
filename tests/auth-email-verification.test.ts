// @vitest-environment node

import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEnv, setupMiniflare } from "./helpers/db";

const env = createTestEnv();
const remoteEnv = createTestEnv();
let mf: Miniflare;

beforeAll(async () => {
  ({ mf, db: env.DB } = await setupMiniflare());
  remoteEnv.DB = env.DB;
  remoteEnv.ALLOWED_HOSTS = "agent-kanban.dev";
});

afterAll(async () => {
  await mf.dispose();
});

describe("email verification auth", () => {
  it("sends a verification email on sign-up and does not create a session", async () => {
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(remoteEnv);

    const result = await auth.api.signUpEmail({
      body: { name: "Verify User", email: "verify-user@test.com", password: "password-123", callbackURL: "/" },
    });

    expect(result.token).toBeNull();
  });

  it("rejects unverified email sign-in", async () => {
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(remoteEnv);

    await expect(
      auth.api.signInEmail({
        body: { email: "verify-user@test.com", password: "password-123", callbackURL: "/" },
      }),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
  });

  it("logs the verification link instead of sending email", async () => {
    const { createAuth } = await import("../apps/web/server/betterAuth");
    const auth = createAuth(env);

    const result = await auth.api.signUpEmail({
      body: { name: "Local Verify User", email: "local-verify-user@test.com", password: "password-123", callbackURL: "/" },
    });

    expect(result.token).toBeNull();
  });
});
