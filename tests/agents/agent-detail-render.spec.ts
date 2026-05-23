// spec: specs/agent-kanban.plan.md
// section: Team member detail page renders identity card

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Team Members — detail page", () => {
  test("Team member detail page renders identity card", async ({ page }) => {
    await signUpAndGetBoard(page, `team_detail_render_${Date.now()}@example.com`);
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

    // expect: Back link is visible
    await expect(page.getByRole("link", { name: "← Agents" })).toBeVisible();

    // expect: The identity card shows the member name
    await expect(page.getByRole("heading", { name: "Peaches" })).toBeVisible();

    // expect: built-in badge and handle are visible
    await expect(page.getByText("built-in")).toBeVisible();
    await expect(page.getByText("@peaches")).toBeVisible();

    // expect: Role label is visible (exact to avoid matching description/soul text)
    await expect(page.getByText("Architect", { exact: true })).toBeVisible();
  });
});
