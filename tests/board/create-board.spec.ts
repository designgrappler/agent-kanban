import { expect, test } from "@playwright/test";
import { signUpVerified } from "../helpers/auth";

test.describe("Create Board flow", () => {
  test("single-step form: fill name + theme → submit → daemon handoff modal → land on /boards/:id", async ({ page }) => {
    await signUpVerified(page, `createboard_${Date.now()}@example.com`, "New User");
    await page.goto("/boards/new");
    await expect(page).toHaveURL(/\/boards\/new/);

    // Heading and tagline visible
    await expect(page.getByRole("heading", { name: "Agent Kanban" })).toBeVisible();
    await expect(page.getByText("Your AI workforce starts here.")).toBeVisible();

    // No step indicator dots
    const dots = page.locator(".rounded-full.w-2.h-2");
    await expect(dots).toHaveCount(0);

    // Labels are sprint-centric
    await expect(page.getByText("Sprint board name")).toBeVisible();
    await expect(page.getByText("Sprint theme")).toBeVisible();

    // Fill board name
    const boardNameInput = page.getByRole("textbox").first();
    await expect(boardNameInput).toHaveValue("My Board");
    await boardNameInput.clear();
    await boardNameInput.fill("Launch Infra");

    // Submit
    await page.getByRole("button", { name: "Create Board" }).click();

    // Daemon handoff modal appears — new user has no machines so the "no machine" branch shows
    await expect(page.getByText("No machine registered")).toBeVisible({ timeout: 10_000 });

    // Dismiss modal via "Later" button — should navigate to /boards/:id
    await page.getByRole("button", { name: "Later" }).click();
    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/boards\/new/);
  });

  test("daemon handoff modal: no-machine branch shows Settings link and hides command block", async ({ page }) => {
    await signUpVerified(page, `createboard_handoff_${Date.now()}@example.com`, "New User");
    await page.goto("/boards/new");

    await page.getByRole("button", { name: "Create Board" }).click();

    // Modal opens with no-machine branch (new user has no registered machines)
    await expect(page.getByText("No machine registered")).toBeVisible({ timeout: 10_000 });

    // Command block must not appear
    await expect(page.getByText(/ak start/i)).not.toBeVisible();

    // Settings link present
    await expect(page.getByRole("button", { name: /open daemon connection settings/i })).toBeVisible();

    // Dismiss
    await page.getByRole("button", { name: "Later" }).click();
    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
  });

  test("no AddMachineSteps terminal block is ever shown", async ({ page }) => {
    await signUpVerified(page, `createboard_no_terminal_${Date.now()}@example.com`, "New User");
    await page.goto("/boards/new");

    await page.getByRole("button", { name: "Create Board" }).click();

    // Daemon handoff modal opens — dismiss it
    await expect(page.getByText("No machine registered")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Later" }).click();

    // Should navigate away; never show the legacy terminal command block (AddMachineSteps)
    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
    await expect(page.getByText(/npx/i)).not.toBeVisible();
    await expect(page.getByText(/Waiting for connection/i)).not.toBeVisible();
  });
});
