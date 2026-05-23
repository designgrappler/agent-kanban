// spec: specs/agent-kanban.plan.md
// section: 7.4 'New agent' button navigates to agent creation page
// NOTE: S13-T1 removed the "New agent" button from AgentsPage entirely. The /agents/new route
// still exists but there is no longer a link to it from the team members listing page.
// Marked fixme until a new entry point is added or this feature is retired.

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Agents Page", () => {
  // S13-T1 removed the "New agent" button from AgentsPage. There is no longer a link
  // to /agents/new from the team members listing page.
  test.fixme("'New agent' button navigates to agent creation page", async ({ page }) => {
    // 1. Sign in, navigate to /agents, and click the 'New agent' button
    await signUpAndGetBoard(page, `agents_newbtn_${Date.now()}@example.com`);
    await page.goto("/agents");

    await expect(page.getByRole("link", { name: "New agent" })).toBeVisible();
    await page.getByRole("link", { name: "New agent" }).click();

    // expect: The browser navigates to /agents/new
    await expect(page).toHaveURL(/\/agents\/new/);

    // expect: The AgentNewPage is displayed with the 'New agent' heading
    await expect(page.getByRole("heading", { name: "New agent" })).toBeVisible();

    // expect: 'Recruit' and 'Custom' option cards are shown
    await expect(page.getByRole("button", { name: /Recruit/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Custom/ })).toBeVisible();
  });
});
