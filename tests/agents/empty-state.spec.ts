// spec: S13-T2 — zero-state → "Add backlog items" → board created → backlog renders

import { expect, Page, test } from "@playwright/test";
import { signUpVerified } from "../helpers/auth";

/**
 * Signs up a new user WITHOUT creating a board or going through onboarding.
 * This produces the zero-state: no boards, no team members.
 */
async function signUpWithNoBoard(page: Page, email: string): Promise<void> {
  await signUpVerified(page, email);
  // signUpVerified leaves us on /auth with a session. Navigate to /agents.
  await page.goto("/agents");
}

test.describe("AgentsPage — zero-state empty state", () => {
  test("zero-state renders heading and both CTAs", async ({ page }) => {
    await signUpWithNoBoard(page, `agents_zero_state_${Date.now()}@example.com`);

    // Mock boards list to return empty array (zero-state condition)
    await page.route("**/api/boards", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    // Mock team members to return empty array
    await page.route("**/api/team-members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    await page.goto("/agents");

    // Empty state should show the "Build your team" heading
    await expect(page.getByRole("heading", { name: "Build your team" })).toBeVisible();

    // Primary CTA
    await expect(page.getByRole("button", { name: "Add backlog items" })).toBeVisible();

    // Secondary CTA
    await expect(page.getByRole("button", { name: "Create board" })).toBeVisible();
  });

  test("zero-state 'Create board' button navigates to /boards/new", async ({ page }) => {
    await signUpWithNoBoard(page, `agents_create_board_${Date.now()}@example.com`);

    await page.route("**/api/boards", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });
    await page.route("**/api/team-members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    await page.goto("/agents");
    await expect(page.getByRole("button", { name: "Create board" })).toBeVisible();
    await page.getByRole("button", { name: "Create board" }).click();
    await expect(page).toHaveURL(/\/boards\/new/);
  });

  test("zero-state 'Add backlog items' creates default board and navigates to backlog", async ({ page }) => {
    await signUpWithNoBoard(page, `agents_add_backlog_${Date.now()}@example.com`);

    const newBoardId = "board-test-id-001";

    await page.route("**/api/boards", async (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      if (route.request().method() === "POST") {
        const body = await route.request().postDataJSON();
        if (body?.name === "My Board" && body?.type === "dev") {
          return route.fulfill({
            status: 201,
            contentType: "application/json",
            body: JSON.stringify({ id: newBoardId, name: "My Board", type: "dev" }),
          });
        }
      }
      return route.continue();
    });

    await page.route("**/api/team-members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    // Stub the backlog page API calls so the navigation target doesn't error out
    await page.route(`**/api/boards/${newBoardId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: newBoardId, name: "My Board", type: "dev", tasks: [], labels: [] }),
      }),
    );
    await page.route(`**/api/boards/${newBoardId}/backlog-items**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
    );

    await page.goto("/agents");
    await expect(page.getByRole("button", { name: "Add backlog items" })).toBeVisible();

    await page.getByRole("button", { name: "Add backlog items" }).click();

    // Should navigate to the backlog of the newly created board
    await expect(page).toHaveURL(new RegExp(`/boards/${newBoardId}/backlog`));
  });

  test("zero-state 'Add backlog items' routes to existing board if one exists", async ({ page }) => {
    await signUpWithNoBoard(page, `agents_existing_board_${Date.now()}@example.com`);

    const existingBoardId = "existing-board-001";

    // Phase 1: always return [] so zero-state renders regardless of pending pre-mock requests
    await page.route("**/api/boards", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    await page.route("**/api/team-members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      }
      return route.continue();
    });

    await page.route(`**/api/boards/${existingBoardId}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: existingBoardId, name: "Existing Board", type: "dev", tasks: [], labels: [] }),
      }),
    );
    await page.route(`**/api/boards/${existingBoardId}/backlog-items**`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) }),
    );

    await page.goto("/agents");
    await expect(page.getByRole("button", { name: "Add backlog items" })).toBeVisible();

    // Phase 2: override GET to return existing board (LIFO — takes priority over phase 1 route)
    await page.route("**/api/boards", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([{ id: existingBoardId, name: "Existing Board" }]),
        });
      }
      return route.continue();
    });

    await page.getByRole("button", { name: "Add backlog items" }).click();
    await expect(page).toHaveURL(new RegExp(`/boards/${existingBoardId}/backlog`));
  });

  test("non-zero state shows 'Recruit an agent' and 'Add team member' header buttons", async ({ page }) => {
    await signUpWithNoBoard(page, `agents_nonzero_${Date.now()}@example.com`);

    const mockMember = {
      id: "tm-1",
      username: "peaches",
      display_name: "peaches",
      name: "Peaches",
      owner_id: "u-1",
      role: "architect",
      builtin: 1,
      version: "latest",
      capabilities: ["Read", "Write"],
      handoff_to: [],
      skills: [],
      bio: "Test bio",
      soul: null,
      md_path: null,
      avatar_path: null,
      description: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await page.route("**/api/team-members", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([mockMember]) });
      }
      return route.continue();
    });

    await page.route("**/api/boards", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([{ id: "b-1", name: "My Board" }]) });
      }
      return route.continue();
    });

    await page.goto("/agents");

    // Non-zero state: header CTAs visible
    await expect(page.getByRole("button", { name: "Recruit an agent" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add team member" })).toBeVisible();

    // Zero-state component should NOT be present
    await expect(page.getByRole("heading", { name: "Build your team" })).not.toBeVisible();
  });
});
