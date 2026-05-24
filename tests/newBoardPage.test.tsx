// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return { ...original, useNavigate: () => mockNavigate };
});

const mockMutateAsync = vi.fn();
vi.mock("../apps/web/src/hooks/useBoard", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useCreateBoard: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
    // Stub useBoards so Header doesn't need QueryClientProvider
    useBoards: () => ({ boards: [], loading: false, refresh: vi.fn() }),
  };
});

// Stub useMachines to avoid needing QueryClientProvider
vi.mock("../apps/web/src/hooks/useMachines", () => ({
  useMachines: () => ({ machines: [], loading: false, refresh: vi.fn() }),
  useMachine: () => ({ machine: null, loading: false, refresh: vi.fn() }),
  useDeleteMachine: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const mockGetNextNumber = vi.fn();
vi.mock("../apps/web/src/lib/api", () => ({
  api: {
    boards: { list: vi.fn().mockResolvedValue([]) },
    sprints: {
      getNextNumber: mockGetNextNumber,
    },
  },
}));

// Stub Header so we only test NewBoardPage internals
vi.mock("../apps/web/src/components/Header", () => ({
  Header: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function renderPage() {
  const { NewBoardPage } = await import("../apps/web/src/routes/NewBoardPage.js");
  render(React.createElement(MemoryRouter, null, React.createElement(NewBoardPage)));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("NewBoardPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockMutateAsync.mockReset();
    mockGetNextNumber.mockReset();

    mockGetNextNumber.mockResolvedValue({ next_number: 3 });
    mockMutateAsync.mockResolvedValue({ id: "board-abc" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders a single-step form with no step indicator dots", async () => {
    await renderPage();
    // The old 2-step wizard had dots; no dots should exist now
    const dots = document.querySelectorAll(".rounded-full.w-2.h-2");
    expect(dots).toHaveLength(0);
  });

  it("shows 'Sprint board name' label", async () => {
    await renderPage();
    expect(screen.getByText("Sprint board name")).toBeTruthy();
  });

  it("shows 'Sprint theme' label", async () => {
    await renderPage();
    expect(screen.getByText("Sprint theme")).toBeTruthy();
  });

  it("does not contain AddMachineSteps in the tree", async () => {
    await renderPage();
    // AddMachineSteps shows a "Waiting for connection..." message
    expect(screen.queryByText(/Waiting for connection/i)).toBeNull();
    // And a terminal command block (npx is from legacy AddMachineSteps; ak start only appears in modal if machines exist)
    expect(screen.queryByText(/npx/i)).toBeNull();
  });

  it("pre-fills board name with 'My Board'", async () => {
    await renderPage();
    // Use getAllByRole to select the first textbox (the board name input, not the theme textarea)
    const inputs = screen.getAllByRole("textbox");
    expect((inputs[0] as HTMLInputElement).value).toBe("My Board");
  });

  it("prefixes name with S{N}- on submit and opens daemon handoff modal", async () => {
    await renderPage();

    const inputs = screen.getAllByRole("textbox");
    const boardNameInput = inputs[0] as HTMLInputElement;
    fireEvent.change(boardNameInput, { target: { value: "UX Polish" } });

    fireEvent.click(screen.getByRole("button", { name: "Create Board" }));

    await waitFor(() => {
      expect(mockGetNextNumber).toHaveBeenCalledOnce();
      expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: "S3-UX Polish", type: "dev" }));
      // Navigation deferred to modal close; modal opens first with "No machine registered"
      expect(screen.getByText("No machine registered")).toBeTruthy();
    });
  });

  it("navigates to /boards/:id after closing the daemon handoff modal", async () => {
    await renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Create Board" }));

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText("No machine registered")).toBeTruthy();
    });

    // Close modal via "Later" button
    fireEvent.click(screen.getByRole("button", { name: "Later" }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/boards/board-abc", { replace: true });
    });
  });

  it("uses sprint number 1 as prefix when no sprints exist yet", async () => {
    mockGetNextNumber.mockResolvedValueOnce({ next_number: 1 });

    await renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create Board" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ name: "S1-My Board" }));
    });
  });
});
