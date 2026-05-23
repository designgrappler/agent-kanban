// spec: specs/agent-kanban.plan.md
// section: 4.5 Repositories no longer in avatar dropdown (S13-T3)
// The Repositories link was removed from the profile dropdown in S13-T3.
// Repositories page remains accessible via direct URL but has no dropdown entry.

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Header and Navigation", () => {
  test("Repositories is not in the avatar dropdown", async ({ page }) => {
    // 1. Sign in and open the avatar dropdown
    await signUpAndGetBoard(page, `headerrepos_${Date.now()}@example.com`);

    const header = page.locator("header");
    const avatarButton = header.locator("button.rounded-full");
    await avatarButton.click();

    const dropdown = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdown).toBeVisible();

    // expect: 'Repositories' is no longer in the dropdown menu
    await expect(dropdown.getByRole("menuitem", { name: "Repositories" })).not.toBeVisible();
  });

  test("Repositories page is still accessible via direct URL", async ({ page }) => {
    // 1. Sign in and navigate directly to /repositories
    await signUpAndGetBoard(page, `headerrepos2_${Date.now()}@example.com`);
    await page.goto("/repositories");

    // expect: The user is on /repositories
    await expect(page).toHaveURL(/\/repositories/);

    // expect: The Repositories page is displayed
    await expect(page.getByRole("heading", { name: "Repositories" })).toBeVisible();
  });
});
