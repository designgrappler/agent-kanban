import { expect, test } from "@playwright/test";
import { signUpVerified } from "../helpers/auth";

const now = "2026-05-04T12:00:00.000Z";

const sprint = {
  id: "sprint-active-1",
  board_id: "board-sprint-1",
  number: 8,
  theme: "Sprint Object Foundation",
  status: "active",
  opened_at: now,
  closed_at: null,
  created_by: "test",
};

const sprintTask = {
  id: "task-sprint-1",
  board_id: "board-sprint-1",
  seq: 1,
  status: "todo",
  title: "Backend foundation",
  description: null,
  repository_id: null,
  repository_name: null,
  labels: [],
  created_by: "test",
  assigned_to: null,
  agent_name: null,
  agent_public_key: null,
  active_session_id: null,
  result: null,
  pr_url: null,
  input: null,
  created_from: null,
  scheduled_at: null,
  position: 0,
  sprint_id: "sprint-active-1",
  track_number: 1,
  created_at: now,
  updated_at: now,
  blocked: false,
  depends_on: [],
  subtask_count: 0,
  duration_minutes: null,
  notes: [],
};

const board = {
  id: "board-sprint-1",
  name: "Sprint Board",
  description: null,
  type: "ops",
  visibility: "private",
  share_slug: null,
  task_seq: 1,
  created_at: now,
  updated_at: now,
  tasks: [sprintTask],
};

test.describe("Sprint Header & Track Chip", () => {
  test("renders TRACKS column header, sprint banner, and S{n}-T{m} chip", async ({ page }) => {
    await signUpVerified(page, `sprint_${Date.now()}@example.com`);

    await page.route("**/api/boards/board-sprint-1", async (route) => {
      await route.fulfill({ json: board });
    });
    await page.route("**/api/boards/board-sprint-1/sprints/active", async (route) => {
      await route.fulfill({ json: sprint });
    });
    await page.route("**/api/repositories", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/boards/board-sprint-1");

    // Sprint banner is visible with theme + Active status badge.
    const banner = page.getByTestId("sprint-header");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Sprint 8");
    await expect(banner).toContainText("Sprint Object Foundation");
    await expect(banner).toContainText(/Active/i);

    // Column header reads "Tracks" (renamed from "Todo").
    const columnGrid = page.locator(".hidden.md\\:grid");
    await expect(columnGrid.getByText("Tracks", { exact: true })).toBeVisible();
    await expect(columnGrid.getByText("Todo", { exact: true })).toHaveCount(0);

    // Track chip on the seeded task: S8-T1.
    const card = page.locator('[data-task-id="task-sprint-1"]').first();
    await expect(card).toBeVisible();
    await expect(card.getByTestId("task-track-chip")).toHaveText("S8-T1");
  });

  test("renders empty-state banner when no active sprint", async ({ page }) => {
    await signUpVerified(page, `sprint_empty_${Date.now()}@example.com`);

    const emptyBoard = { ...board, id: "board-sprint-empty", tasks: [] };

    await page.route("**/api/boards/board-sprint-empty", async (route) => {
      await route.fulfill({ json: emptyBoard });
    });
    await page.route("**/api/boards/board-sprint-empty/sprints/active", async (route) => {
      await route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND", message: "no active sprint" } } });
    });
    await page.route("**/api/repositories", async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto("/boards/board-sprint-empty");

    const empty = page.getByTestId("sprint-header-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("No active sprint");
    await expect(empty).toContainText("ak sprint open");
  });
});
