import { expect, test } from "@playwright/test";
import { signUpVerified } from "../helpers/auth";

test.describe("Board Page — onboarding flow", () => {
  test("navigating to /boards/new shows the single-step create-board form", async ({ page }) => {
    await signUpVerified(page, `onboarding_${Date.now()}@example.com`, "New User");
    await page.goto("/boards/new");
    await expect(page).toHaveURL(/\/boards\/new/);

    // Heading and tagline
    await expect(page.getByRole("heading", { name: "Agent Kanban" })).toBeVisible();
    await expect(page.getByText("Your AI workforce starts here.")).toBeVisible();

    // Single-step: no wizard dots
    const dots = page.locator(".rounded-full.w-2.h-2");
    await expect(dots).toHaveCount(0);

    // Sprint-centric labels
    await expect(page.getByText("Sprint board name")).toBeVisible();

    // Input pre-filled
    const boardNameInput = page.getByRole("textbox").first();
    await expect(boardNameInput).toHaveValue("My Board");

    // Submit → land on board directly, no AddMachineSteps shown
    await boardNameInput.clear();
    await boardNameInput.fill("Sprint 1");
    await page.getByRole("button", { name: "Create Board" }).click();

    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
    await expect(page.getByText(/Waiting for connection/i)).not.toBeVisible();
  });
});
