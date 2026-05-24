import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

// Helpers to call the backlog API from within a page context
async function createBacklogItem(
  page: import("@playwright/test").Page,
  boardId: string,
  item: { title: string; description?: string; priority: string },
) {
  return page.evaluate(
    async ({ boardId, item }) => {
      const token = localStorage.getItem("auth-token");
      const res = await fetch(`/api/boards/${boardId}/backlog-items`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      return (await res.json()) as { id: string; title: string; priority: string; status: string };
    },
    { boardId, item },
  );
}

async function getBoardId(page: import("@playwright/test").Page): Promise<string> {
  const match = page.url().match(/\/boards\/([^/]+)/);
  if (!match) throw new Error(`Could not extract boardId from URL: ${page.url()}`);
  return match[1];
}

test.describe("Backlog Page", () => {
  test("Add backlog item — appears in priority group", async ({ page }) => {
    await signUpAndGetBoard(page, `backlog_add_${Date.now()}@example.com`);
    const boardId = await getBoardId(page);

    await page.goto(`/boards/${boardId}/backlog`);
    await expect(page.locator("h1")).toContainText("Backlog");

    // Click "Add item"
    await page.getByRole("button", { name: "Add item" }).click();

    // Fill in the dialog
    await page.getByLabel("Title").fill("test idea");
    await page.getByLabel("Description").fill("a useful description");

    // Set priority to P2 via select
    await page.getByRole("combobox", { name: "Priority" }).click();
    await page.getByRole("option", { name: "P2" }).click();

    await page.getByRole("button", { name: "Add item" }).last().click();

    // Item appears in P2 group
    const p2Group = page.locator('[data-testid="backlog-priority-group"][data-priority="P2"]');
    await expect(p2Group).toContainText("test idea");
  });

  test("Edit item — title updates to 'test idea v2'", async ({ page }) => {
    await signUpAndGetBoard(page, `backlog_edit_${Date.now()}@example.com`);
    const boardId = await getBoardId(page);

    // Seed an item directly via API
    await page.goto(`/boards/${boardId}/backlog`);
    await createBacklogItem(page, boardId, { title: "test idea", description: "original", priority: "P2" });
    await page.reload();

    // Hover over the card to reveal the edit button
    const card = page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "test idea" }).first();
    await card.hover();
    await card.getByRole("button", { name: /Edit backlog item/ }).click();

    // Clear and type new title
    const titleInput = page.getByLabel("Title");
    await titleInput.clear();
    await titleInput.fill("test idea v2");

    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "test idea v2" })).toBeVisible();
    await expect(page.locator('[data-testid="backlog-item-card"]').filter({ hasText: /^test idea$/ })).toHaveCount(0);
  });

  test("Delete item — gone from list", async ({ page }) => {
    await signUpAndGetBoard(page, `backlog_delete_${Date.now()}@example.com`);
    const boardId = await getBoardId(page);

    await page.goto(`/boards/${boardId}/backlog`);
    await createBacklogItem(page, boardId, { title: "to be deleted", priority: "P1" });
    await page.reload();

    const card = page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "to be deleted" }).first();
    await card.hover();
    await card.getByRole("button", { name: /Delete backlog item/ }).click();

    // Confirm delete dialog
    await page.getByRole("button", { name: "Delete" }).last().click();

    await expect(page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "to be deleted" })).toHaveCount(0);
  });

  test("Multi-select + Create plan — toast shows, items transition to in_planning, clipboard has prompt", async ({ page, context }) => {
    // Grant clipboard permissions so navigator.clipboard.writeText works
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await signUpAndGetBoard(page, `backlog_plan_${Date.now()}@example.com`);
    const boardId = await getBoardId(page);

    await page.goto(`/boards/${boardId}/backlog`);

    // Create three items
    await createBacklogItem(page, boardId, { title: "Alpha feature", description: "First item description", priority: "P0" });
    await createBacklogItem(page, boardId, { title: "Beta feature", description: "Second item description", priority: "P1" });
    await createBacklogItem(page, boardId, { title: "Gamma feature", description: "Third item description", priority: "P2" });

    await page.reload();

    // Select Alpha and Beta (first two items) — skip Gamma
    const alphaCard = page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "Alpha feature" });
    const betaCard = page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "Beta feature" });

    await alphaCard.locator('[data-testid="backlog-item-checkbox"]').check();
    await betaCard.locator('[data-testid="backlog-item-checkbox"]').check();

    // "Create plan" button should now be enabled
    const createPlanBtn = page.getByTestId("create-plan-button");
    await expect(createPlanBtn).not.toBeDisabled();

    // Click Create plan
    await createPlanBtn.click();

    // Expect a success toast
    await expect(page.getByText(/Plan prompt copied to clipboard/)).toBeVisible({ timeout: 5000 });

    // Wait for items to update in the UI (query invalidation)
    await expect(alphaCard.locator('[data-status="in_planning"]')).toBeVisible({ timeout: 5000 });
    await expect(betaCard.locator('[data-status="in_planning"]')).toBeVisible({ timeout: 5000 });

    // Alpha and Beta no longer show edit/delete affordances (locked once in_planning)
    // Hover to check: edit button should not exist
    await alphaCard.hover();
    await expect(alphaCard.getByRole("button", { name: /Edit backlog item/ })).toHaveCount(0);
    await betaCard.hover();
    await expect(betaCard.getByRole("button", { name: /Edit backlog item/ })).toHaveCount(0);

    // Gamma is unaffected and still shows idea status
    const gammaCard = page.locator('[data-testid="backlog-item-card"]').filter({ hasText: "Gamma feature" });
    await expect(gammaCard.locator('[data-status="idea"]')).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("Plan a sprint covering these backlog items:");
    expect(clipboardText).toContain("Alpha feature");
    expect(clipboardText).toContain("First item description");
    expect(clipboardText).toContain("Beta feature");
    expect(clipboardText).toContain("Second item description");
    expect(clipboardText).toContain("Use the Architect skill (Peaches)");
  });

  test("Create plan button disabled when nothing selected", async ({ page }) => {
    await signUpAndGetBoard(page, `backlog_disabled_${Date.now()}@example.com`);
    const boardId = await getBoardId(page);

    await page.goto(`/boards/${boardId}/backlog`);

    const createPlanBtn = page.getByTestId("create-plan-button");
    await expect(createPlanBtn).toBeDisabled();
  });
});
