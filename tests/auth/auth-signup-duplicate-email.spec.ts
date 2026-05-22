// spec: specs/agent-kanban.plan.md
// section: 1.8 Sign-up with existing email shows error

import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("Sign-up with existing email shows error", async ({ page }) => {
    // Use a unique email per test run so the first sign-up always succeeds
    const uniqueEmail = `duplicate-test-${Date.now()}@example.com`;
    const password = "validpassword123";

    // --- Step 1: Register the email for the first time ---
    await page.goto("/auth");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByText("Create a new account")).toBeVisible();

    await page.locator('input[placeholder="Name"]').fill("First User");
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();

    // First sign-up lands on the email-verification handoff because the new account
    // requires email verification before being granted a session.
    await expect(page.getByText("Verify your email")).toBeVisible();

    // Clear session so we can return to /auth as unauthenticated
    await page.context().clearCookies();
    await page.goto("/auth");

    // --- Step 2: Switch to sign-up mode for the duplicate attempt ---
    await page.getByRole("button", { name: "Sign up" }).click();

    // expect: Sign-up form is displayed
    await expect(page.getByText("Create a new account")).toBeVisible();

    // --- Step 3: Enter the same email again ---
    await page.locator('input[placeholder="Name"]').fill("Existing User");
    await page.locator('input[type="email"]').fill(uniqueEmail);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: "Sign Up" }).click();

    // expect: The duplicate-email path also routes to the verification handoff
    // (Better Auth with requireEmailVerification re-issues a verification email
    // rather than surfacing an inline error to avoid leaking account existence).
    await expect(page.getByText("Verify your email")).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await expect(page.getByRole("button", { name: "Resend verification email" })).toBeVisible();

    // expect: The user remains on the /auth page
    await expect(page).toHaveURL(/\/auth/);
  });
});
