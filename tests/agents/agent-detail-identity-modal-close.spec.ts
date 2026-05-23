// spec: specs/agent-kanban.plan.md
// section: Team member detail page renders handoff targets

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page renders handoff targets", async ({ page }) => {
    await signUpAndGetBoard(page, `team_handoff_${Date.now()}@example.com`);
    await page.goto("/agents");

    await page
      .getByRole("link", { name: /peaches/ })
      .first()
      .waitFor({ state: "visible" });
    await page
      .getByRole("link", { name: /peaches/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/team\/peaches/);

    await page.getByRole("link", { name: "← Agents" }).waitFor({ state: "visible" });

    // expect: Hands off to section is visible
    await expect(page.getByText("Hands off to")).toBeVisible();

    // expect: Peaches hands off to skylar (exact to avoid matching soul pre block)
    await expect(page.getByText("skylar", { exact: true })).toBeVisible();
  });
});
