// spec: specs/agent-kanban.plan.md
// section: 7.3 Team member card links to team member detail page
// NOTE: S13-T1 replaced AgentCards (linked to /agents/:id) with TeamCards (link to /team/:username).
// The detail page (TeamMemberDetailPage) still shows a "← Agents" back link and the member's name.

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Agents Page", () => {
  test("Team member card links to team member detail page", async ({ page }) => {
    // 1. Sign in, navigate to /agents, and click on a team member card
    await signUpAndGetBoard(page, `agents_card_${Date.now()}@example.com`);
    await page.goto("/agents");

    await page.getByText("peaches").first().waitFor({ state: "visible" });

    // Click the "peaches" team card (links to /team/peaches)
    await page
      .getByRole("link", { name: /peaches/ })
      .first()
      .click();

    // expect: The browser navigates to /team/:username
    await expect(page).toHaveURL(/\/team\/.+/);

    // expect: The team member detail page shows the "← Agents" back link
    await page.getByText("← Agents").first().waitFor({ state: "visible" });

    // expect: The detail page heading shows the member's name ("Peaches")
    await expect(page.getByRole("heading", { name: "Peaches" })).toBeVisible();
  });
});
