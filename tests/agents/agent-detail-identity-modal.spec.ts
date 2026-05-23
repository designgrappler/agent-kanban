// spec: specs/agent-kanban.plan.md
// section: Team member detail page renders capabilities metadata

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page renders capabilities", async ({ page }) => {
    await signUpAndGetBoard(page, `team_caps_${Date.now()}@example.com`);
    await page.goto("/agents");

    await page
      .getByRole("link", { name: /bandit/ })
      .first()
      .waitFor({ state: "visible" });
    await page
      .getByRole("link", { name: /bandit/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/team\/bandit/);

    await page.getByRole("link", { name: "← Agents" }).waitFor({ state: "visible" });

    // expect: Capabilities section is visible
    await expect(page.getByText("Capabilities")).toBeVisible();

    // expect: Bandit's capabilities (Read, Bash) are shown
    await expect(page.getByText("Read", { exact: true })).toBeVisible();
    await expect(page.getByText("Bash", { exact: true })).toBeVisible();
  });
});
