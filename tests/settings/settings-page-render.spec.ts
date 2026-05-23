// spec: specs/agent-kanban.plan.md
// section: 5.1 Settings page displays four tabs (Profile, Account, Labels, Daemon connection)

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Settings Page", () => {
  test("redirects /settings to the profile settings page", async ({ page }) => {
    await signUpAndGetBoard(page, `settings_redirect_${Date.now()}@example.com`);

    await page.goto("/settings");

    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
  });

  test("renders all four sidebar entries with profile active", async ({ page }) => {
    await signUpAndGetBoard(page, `settings_sidebar_${Date.now()}@example.com`);

    await page.goto("/settings/profile");

    const settingsNav = page.getByRole("navigation", { name: "Settings" });
    await expect(settingsNav.getByRole("link")).toHaveText(["Profile", "Account", "Labels", "Daemon connection"]);
    await expect(settingsNav.getByRole("link", { name: "Profile" })).toHaveAttribute("class", /bg-accent-soft/);
    await expect(settingsNav.getByRole("link", { name: "Account" })).not.toHaveAttribute("class", /bg-accent-soft/);
    await expect(settingsNav.getByRole("link", { name: "Labels" })).not.toHaveAttribute("class", /bg-accent-soft/);
    await expect(settingsNav.getByRole("link", { name: "Daemon connection" })).not.toHaveAttribute("class", /bg-accent-soft/);
  });

  test("Labels tab renders stub copy", async ({ page }) => {
    await signUpAndGetBoard(page, `settings_labels_${Date.now()}@example.com`);

    await page.goto("/settings/labels");

    await expect(page.getByRole("heading", { name: "Labels", level: 1 })).toBeVisible();
    await expect(page.getByText("Labels are currently per-board.")).toBeVisible();
    await expect(page.getByText("Manage them in board settings.")).toBeVisible();
  });

  test("Daemon connection tab renders machines content", async ({ page }) => {
    await signUpAndGetBoard(page, `settings_daemon_${Date.now()}@example.com`);

    await page.goto("/settings/daemon-connection");

    await expect(page.getByRole("heading", { name: "Daemon connection", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Machine" }).first()).toBeVisible();
  });
});
