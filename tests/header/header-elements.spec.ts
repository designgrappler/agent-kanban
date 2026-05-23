// spec: specs/agent-kanban.plan.md
// section: 4.1 Header renders logo, nav links, and user avatar

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Header and Navigation", () => {
  test("Header renders logo, Agents nav link, and user avatar", async ({ page }) => {
    // 1. Sign in and navigate to any protected page (e.g. /settings)
    await signUpAndGetBoard(page, `headerelemts_${Date.now()}@example.com`);
    await page.goto("/settings");

    // expect: The header shows 'Agent Kanban' logo on the left
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByRole("link", { name: "Agent Kanban" })).toBeVisible();

    // expect: Nav link 'Agents' is visible on desktop; 'Machines' is no longer in the nav
    await expect(header.getByRole("link", { name: "Agents" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Machines" })).not.toBeVisible();

    // expect: A user avatar button is visible on the right
    // The avatar is inside a DropdownMenuTrigger button
    const avatarButton = header.locator("button").filter({ has: page.locator('[data-slot="avatar"]') });
    await expect(avatarButton).toBeVisible();

    // expect: No standalone theme toggle button in the header bar
    // (theme toggle has moved into the avatar dropdown)
    const headerButtons = header.locator("button");
    await expect(headerButtons).toHaveCount(1);
  });
});
