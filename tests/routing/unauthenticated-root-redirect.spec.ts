// spec: specs/agent-kanban.plan.md
// section: 2.1 Root URL serves the public landing page for unauthenticated users

import { expect, test } from "@playwright/test";

test.describe("Routing and Navigation Guards", () => {
  test("Root URL serves the public landing page to unauthenticated users", async ({ page, context }) => {
    // 1. Clear all cookies and local storage to ensure no session exists
    await context.clearCookies();
    await context.clearPermissions();

    // Navigate to /
    await page.goto("/");

    // expect: The unauthenticated viewer stays on / (no redirect to /auth)
    await expect(page).toHaveURL(/\/$/);

    // expect: The landing page renders its hero copy and a Sign In affordance
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Kanban/);
  });
});
