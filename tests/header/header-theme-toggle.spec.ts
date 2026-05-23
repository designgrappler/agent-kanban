// spec: specs/agent-kanban.plan.md
// section: 4.2 Theme toggle cycles through dark, light, system (via dropdown menu)

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Header and Navigation", () => {
  test("Theme toggle in dropdown cycles through dark, light, system", async ({ page }) => {
    // 1. Sign in and navigate to any page.
    await signUpAndGetBoard(page, `headertheme_${Date.now()}@example.com`);
    await page.goto("/settings");

    const header = page.locator("header");

    // Open the avatar dropdown to access the theme toggle
    const avatarButton = header.locator("button.rounded-full");
    await avatarButton.click();

    const dropdown = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdown).toBeVisible();

    // The theme toggle item is in the dropdown (no longer a standalone header button)
    const themeItem = dropdown.getByRole("menuitem", { name: /Theme/ });
    await expect(themeItem).toBeVisible();

    // Get the initial HTML class state (may be null, empty, 'dark', 'light', etc.)
    const htmlClass = await page.locator("html").getAttribute("class");

    // 2. Click the theme toggle item three times to cycle through all three states
    // Theme cycle: dark -> light -> system -> dark (cycleTheme function)
    await themeItem.click();
    await avatarButton.click();
    const dropdown2 = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdown2).toBeVisible();
    await dropdown2.getByRole("menuitem", { name: /Theme/ }).click();
    await avatarButton.click();
    const dropdown3 = page.locator('[data-slot="dropdown-menu-content"]');
    await expect(dropdown3).toBeVisible();
    await dropdown3.getByRole("menuitem", { name: /Theme/ }).click();

    // expect: After three clicks, the theme state returns to the original
    // Both null and "" represent no explicit class (system theme), so normalize
    const htmlClassAfter = await page.locator("html").getAttribute("class");
    const normalize = (c: string | null) => c ?? "";
    expect(normalize(htmlClassAfter)).toBe(normalize(htmlClass));
  });
});
