import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, Page } from "@playwright/test";

// AUTH_SECRET source of truth: env var first (CI), then apps/web/.dev.vars (local dev).
// Better Auth signs email-verification tokens with this secret using HS256, so a test-side
// forge of the same shape is accepted by the verification endpoint and round-trips through
// the same D1 handle the running server uses (no external sqlite3 write needed).
const AUTH_SECRET = resolveAuthSecret();

function resolveAuthSecret(): string {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  try {
    const raw = readFileSync(join(process.cwd(), "apps/web/.dev.vars"), "utf8");
    const match = raw.match(/^\s*AUTH_SECRET\s*=\s*"?([^"\r\n]+)"?\s*$/m);
    if (match?.[1]) return match[1];
  } catch {
    // fall through
  }
  throw new Error("AUTH_SECRET not found: set $AUTH_SECRET or define it in apps/web/.dev.vars");
}

/**
 * Signs up a new user, marks email verified, and establishes a browser session
 * (cookie + auth-token in localStorage) WITHOUT navigating through onboarding or
 * board creation. Use this when the test drives navigation itself (e.g. mocked routes).
 */
export async function signUpVerified(page: Page, email: string, name = "Test User"): Promise<void> {
  await page.goto("/auth");
  const origin = new URL(page.url()).origin;
  const res = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({ name, email, password: "password123" }),
  });
  if (!res.ok) throw new Error(`Sign up failed: ${res.status} ${await res.text()}`);

  await verifyEmail(page, email);

  const signInRes = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({ email, password: "password123" }),
  });
  if (!signInRes.ok) throw new Error(`Sign in failed: ${signInRes.status} ${await signInRes.text()}`);

  const token = signInRes.headers.get("set-auth-token");
  const cookie = sessionCookie(signInRes);
  if (!token || !cookie) throw new Error("Sign in did not return a session");

  await page.context().addCookies([{ name: cookie.name, value: cookie.value, url: origin }]);
  await page.evaluate((authToken) => localStorage.setItem("auth-token", authToken), token);
}

/**
 * Signs up a new user and completes the onboarding flow (single-step create-board),
 * then navigates to the actual board page at /boards/:id.
 *
 * Onboarding steps:
 *   0 - DemoBoard (skip to board creation)
 *   1 - Create Board (single-step: board name input + "Create Board" button, navigates directly to board)
 *
 * After create completes, we fetch the board list via the API and navigate directly.
 */
export async function signUpAndGetBoard(page: Page, email: string, name = "Test User"): Promise<void> {
  await page.goto("/auth");
  const origin = new URL(page.url()).origin;
  const res = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({ name, email, password: "password123" }),
  });
  if (!res.ok) throw new Error(`Sign up failed: ${res.status} ${await res.text()}`);

  await verifyEmail(page, email);
  const signInRes = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
    },
    body: JSON.stringify({ email, password: "password123" }),
  });
  if (!signInRes.ok) throw new Error(`Sign in failed: ${signInRes.status} ${await signInRes.text()}`);

  const token = signInRes.headers.get("set-auth-token");
  const cookie = sessionCookie(signInRes);
  if (!token || !cookie) throw new Error("Sign in did not return a session");

  await page.context().addCookies([{ name: cookie.name, value: cookie.value, url: origin }]);
  await page.evaluate((authToken) => localStorage.setItem("auth-token", authToken), token);
  await page.goto("/onboarding");

  // Wait to land on the onboarding page
  await page.waitForURL(/\/onboarding/);
  await page.getByRole("button", { name: "Skip demo" }).click();
  await expect(page).toHaveURL(/\/boards\/new/);

  // Step 1: create the board (also creates API key, advances to step 2)
  await page.getByRole("button", { name: "Create Board" }).click();

  await expect.poll(() => firstBoardId(page)).not.toBeNull();
  const boardId = await firstBoardId(page);

  if (!boardId) throw new Error("No board found after onboarding");

  await page.goto(`/boards/${boardId}`);
  await expect(page).toHaveURL(/\/boards\/.+/);
  // Wait for the board to be fully loaded (column grid visible)
  await expect(page.locator(".hidden.md\\:grid")).toBeVisible();
}

async function firstBoardId(page: Page): Promise<string | null> {
  return page.evaluate(async () => {
    const token = localStorage.getItem("auth-token");
    const res = await fetch("/api/boards", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const boards = (await res.json()) as { id: string }[];
    return boards[0]?.id ?? null;
  });
}

/**
 * Drives the real Better Auth email verification endpoint with a forged HS256 token
 * signed with AUTH_SECRET — the same secret the server uses to issue verification tokens.
 * This goes through the running server's open D1 handle (unlike an external sqlite3 write,
 * which Miniflare's open handle would not see) and clears post-verify cookies so the
 * subsequent sign-in path is the only authenticated session in the page context.
 */
async function verifyEmail(page: Page, email: string): Promise<void> {
  const origin = new URL(page.url()).origin;
  const token = verificationToken(email);
  const res = await fetch(`${origin}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: "GET",
    redirect: "manual",
  });
  // Better Auth returns 302 on successful verification; treat any 2xx/3xx as success.
  if (res.status >= 400) {
    throw new Error(`Email verification failed: ${res.status} ${await res.text()}`);
  }
}

function verificationToken(email: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = { email, iat: now, exp: now + 60 * 60 };
  const encodedHeader = base64Url(JSON.stringify({ alg: "HS256" }));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", AUTH_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function base64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function sessionCookie(res: Response): { name: string; value: string } | null {
  const raw = res.headers.get("set-cookie");
  const pair = raw?.split(";")[0];
  if (!pair) return null;
  const [name, value] = pair.split("=");
  return { name, value: decodeURIComponent(value) };
}
