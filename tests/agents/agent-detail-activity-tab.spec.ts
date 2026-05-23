// spec: specs/agent-kanban.plan.md
// section: Team member detail page renders soul section

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page renders soul section", async ({ page }) => {
    await signUpAndGetBoard(page, `team_soul_${Date.now()}@example.com`);
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

    // expect: Soul section heading is visible
    await expect(page.getByText("Soul")).toBeVisible();

    // expect: Soul pre block is visible (peaches' soul content)
    await expect(page.locator("pre")).toBeVisible();
  });
});
