// spec: specs/agent-kanban.plan.md
// section: Team member detail page shows description

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page shows description", async ({ page }) => {
    await signUpAndGetBoard(page, `team_desc_${Date.now()}@example.com`);
    await page.goto("/agents");

    await page
      .getByRole("link", { name: /skylar/ })
      .first()
      .waitFor({ state: "visible" });
    await page
      .getByRole("link", { name: /skylar/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/team\/skylar/);

    await page.getByRole("link", { name: "← Agents" }).waitFor({ state: "visible" });

    // expect: Skylar's description is shown — scope to p to avoid matching soul pre block
    await expect(page.locator("p", { hasText: "Full Stack Specialist" })).toBeVisible();
  });
});
