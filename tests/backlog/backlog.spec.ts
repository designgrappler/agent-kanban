// spec: docs/context/plan.md
// section: Sprint 9 — backlog page (priority-grouped backlog items)

import { expect, test } from "@playwright/test";
import { signUpAndGetBoard } from "../helpers/auth";

test.describe("Backlog page", () => {
  test("priority groups, create/edit/delete idea items, locked non-idea items", async ({ page }) => {
    await signUpAndGetBoard(page, `backlog_${Date.now()}@example.com`);
    const boardId = page.url().split("/boards/")[1];

    // Header link should appear next to BoardSwitcher when a board is active.
    const backlogLink = page.getByRole("link", { name: "Backlog" });
    await expect(backlogLink).toBeVisible();
    await backlogLink.click();
    await expect(page).toHaveURL(new RegExp(`/boards/${boardId}/backlog$`));

    // Page renders the four priority groups.
    await expect(page.getByRole("heading", { name: "Backlog", level: 1 })).toBeVisible();
    const groups = page.getByTestId("backlog-priority-group");
    await expect(groups).toHaveCount(4);
    await expect(groups.nth(0)).toHaveAttribute("data-priority", "P0");
    await expect(groups.nth(1)).toHaveAttribute("data-priority", "P1");
    await expect(groups.nth(2)).toHaveAttribute("data-priority", "P2");
    await expect(groups.nth(3)).toHaveAttribute("data-priority", "P3");

    // Create a backlog item via the form. Default priority is P2.
    await page.getByRole("button", { name: "Add backlog item" }).click();
    await expect(page.getByRole("dialog", { name: "Add backlog item" })).toBeVisible();
    await page.getByLabel("Title").fill("Investigate caching strategy");
    await page.getByLabel("Description").fill("Look into Cache API for D1 reads");
    await page.getByRole("button", { name: "Add item" }).click();

    // Item appears in the P2 group (default priority).
    const p2Group = page.locator('[data-testid="backlog-priority-group"][data-priority="P2"]');
    const newCard = p2Group.getByTestId("backlog-item-card").filter({ hasText: "Investigate caching strategy" });
    await expect(newCard).toBeVisible();
    await expect(newCard).toContainText("P2");
    await expect(newCard).toContainText("Idea");
    await expect(newCard).toContainText("Look into Cache API for D1 reads");

    // Edit the item: update title + description, leave priority as-is.
    await newCard.hover();
    await newCard.getByRole("button", { name: "Edit backlog item Investigate caching strategy" }).click();
    await expect(page.getByRole("dialog", { name: "Edit backlog item" })).toBeVisible();
    await page.getByLabel("Title").fill("Caching strategy spike");
    await page.getByLabel("Description").fill("Spike: D1 + Cache API");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("dialog", { name: "Edit backlog item" })).toBeHidden();

    const editedCard = p2Group.getByTestId("backlog-item-card").filter({ hasText: "Caching strategy spike" });
    await expect(editedCard).toBeVisible();
    await expect(editedCard).toContainText("Spike: D1 + Cache API");
    // Old title is gone.
    await expect(p2Group.getByTestId("backlog-item-card").filter({ hasText: "Investigate caching strategy" })).toHaveCount(0);

    // Move the item to in_planning via the API, reload, verify edit/delete affordances are gone.
    const itemId = await editedCard.evaluate((el) => el.getAttribute("data-item-id"));
    expect(itemId).toBeTruthy();
    await page.evaluate(
      async ({ id }) => {
        const token = localStorage.getItem("auth-token");
        const res = await fetch(`/api/backlog-items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ status: "in_planning" }),
        });
        if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
      },
      { id: itemId! },
    );
    await page.reload();

    const lockedCard = page.getByTestId("backlog-item-card").filter({ hasText: "Caching strategy spike" });
    await expect(lockedCard).toBeVisible();
    await expect(lockedCard).toContainText("In planning");
    // No edit / delete buttons exist on a locked (non-idea) item.
    await expect(lockedCard.getByRole("button", { name: /Edit backlog item/ })).toHaveCount(0);
    await expect(lockedCard.getByRole("button", { name: /Delete backlog item/ })).toHaveCount(0);

    // Add a fresh idea-status item, then delete it via the dialog.
    await page.getByRole("button", { name: "Add backlog item" }).click();
    await expect(page.getByRole("dialog", { name: "Add backlog item" })).toBeVisible();
    await page.getByLabel("Title").fill("Disposable idea");
    await page.getByRole("button", { name: "Add item" }).click();
    await expect(page.getByRole("dialog", { name: "Add backlog item" })).toBeHidden();

    const disposable = page.getByTestId("backlog-item-card").filter({ hasText: "Disposable idea" });
    await expect(disposable).toBeVisible();
    await disposable.hover();
    await disposable.getByRole("button", { name: "Delete backlog item Disposable idea" }).click();
    await expect(page.getByRole("dialog", { name: "Delete backlog item" })).toBeVisible();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByTestId("backlog-item-card").filter({ hasText: "Disposable idea" })).toHaveCount(0);
  });
});
