// spec: specs/agent-kanban.plan.md
// section: Team member detail page shows source file link

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page shows source file link", async ({ page }) => {
    await signUpAndGetBoard(page, `team_src_${Date.now()}@example.com`);
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

    // expect: Source file section is visible
    await expect(page.getByText("Source file")).toBeVisible();

    // expect: The md_path for bandit is shown
    await expect(page.getByText(".claude/agents/bandit.md")).toBeVisible();
  });
});
