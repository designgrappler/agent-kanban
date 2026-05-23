// spec: specs/agent-kanban.plan.md
// section: 7.1 Agents page (now "Team members") renders built-in team members
// NOTE: S13-T1 renamed the page from "Agents" to "Team members", removed the "New agent" button,
// removed the Workers section, and replaced AgentCards with TeamCards for built-in team members
// (Peaches, Skylar, Bandit). The empty state ("No team members yet.") is not reachable in
// practice because built-in members are always seeded on account creation.

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Agents Page", () => {
  test("Team members page renders heading and built-in team member cards", async ({ page }) => {
    // 1. Sign in as a new user and navigate to /agents
    await signUpAndGetBoard(page, `agents_empty_${Date.now()}@example.com`);
    await page.goto("/agents");

    // expect: Heading 'Team members' is displayed (renamed from 'Agents' in S13-T1)
    await expect(page.getByRole("heading", { name: "Team members" })).toBeVisible();

    // expect: Built-in team member "peaches" is visible (seeded on every new account)
    await page.getByText("peaches").first().waitFor({ state: "visible" });
    await expect(page.getByText("peaches").first()).toBeVisible();
  });
});
