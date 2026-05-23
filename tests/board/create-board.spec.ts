import { expect, test } from "@playwright/test";
import { signUpVerified } from "../helpers/auth";

test.describe("Create Board flow", () => {
  test("single-step form: fill name + theme → submit → land on /boards/:id directly", async ({ page }) => {
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

    // Should navigate directly to /boards/:id — no step 2 wizard
    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/boards\/new/);
  });

  test("no AddMachineSteps terminal block is ever shown", async ({ page }) => {
    await signUpVerified(page, `createboard_no_terminal_${Date.now()}@example.com`, "New User");
    await page.goto("/boards/new");

    await page.getByRole("button", { name: "Create Board" }).click();

    // Should navigate away; never show the terminal command block
    await expect(page).toHaveURL(/\/boards\/.+/, { timeout: 10_000 });
    await expect(page.getByText(/npx|ak start/i)).not.toBeVisible();
    await expect(page.getByText(/Waiting for connection/i)).not.toBeVisible();
  });
});
