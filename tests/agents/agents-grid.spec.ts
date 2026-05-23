// spec: specs/agent-kanban.plan.md
// section: 7.2 Team members page renders member cards in a grid
// NOTE: S13-T1 replaced the Workers section (AgentCards) with a Team section (TeamCards).
// Built-in team members (Peaches, Skylar, Bandit) are seeded on every new account.
// TeamCard shows display_name ("peaches"), username ("@peaches"), and role badge.

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Agents Page", () => {
  test("Team members page renders team member cards in a grid", async ({ page }) => {
    // 1. Sign in as a new user and navigate to /agents
    await signUpAndGetBoard(page, `agents_grid_${Date.now()}@example.com`);
    await page.goto("/agents");

    // Wait for the built-in "peaches" team card to load
    await page.getByText("peaches").first().waitFor({ state: "visible" });

    // expect: Team member cards are displayed in a grid layout
    // TeamCard is a link element whose accessible name comes from the card content
    const teamCard = page.getByRole("link", { name: /peaches/ }).first();
    await expect(teamCard).toBeVisible();

    // expect: Each card shows the member's display name and username
    await expect(teamCard.getByText("peaches").first()).toBeVisible();
    await expect(teamCard.getByText(/@peaches/)).toBeVisible();

    // expect: Role badge is shown (architect role for Peaches)
    await expect(teamCard.getByText("architect")).toBeVisible();
  });
});
