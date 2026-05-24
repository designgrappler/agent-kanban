import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
// biome-ignore lint/correctness/noUnusedImports: vitest lacks automatic JSX runtime; React must be in scope
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DaemonHandoffModal } from "../apps/web/src/components/board/DaemonHandoffModal";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderModal(props: { machines: Array<{ id: string; name: string; status: string }>; boardId?: string }) {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <DaemonHandoffModal open={true} onClose={onClose} boardId={props.boardId ?? "board-abc"} machines={props.machines} />
    </MemoryRouter>,
  );
  return { onClose };
}

describe("DaemonHandoffModal", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    // Stub clipboard
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  describe("with at least one registered machine", () => {
    it("shows the 'Start the daemon' heading", () => {
      renderModal({ machines: [{ id: "m1", name: "swift-falcon", status: "online" }] });
      expect(screen.getByText("Start the daemon to begin working")).toBeInTheDocument();
    });

    it("renders the ak start command block with the correct board id", () => {
      renderModal({ machines: [{ id: "m1", name: "swift-falcon", status: "online" }], boardId: "board-xyz" });
      expect(screen.getByText("ak start --board board-xyz")).toBeInTheDocument();
    });

    it("shows a Copy button", () => {
      renderModal({ machines: [{ id: "m1", name: "swift-falcon", status: "online" }] });
      expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    });

    it("copies the command to clipboard on Copy click", async () => {
      renderModal({ machines: [{ id: "m1", name: "swift-falcon", status: "online" }], boardId: "board-xyz" });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /copy/i }));
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ak start --board board-xyz");
    });

    it("does not show the Settings navigation link", () => {
      renderModal({ machines: [{ id: "m1", name: "swift-falcon", status: "online" }] });
      expect(screen.queryByText(/open daemon connection settings/i)).not.toBeInTheDocument();
    });
  });

  describe("with no registered machines", () => {
    it("shows the 'No machine registered' heading", () => {
      renderModal({ machines: [] });
      expect(screen.getByText("No machine registered")).toBeInTheDocument();
    });

    it("does not render the command block", () => {
      renderModal({ machines: [] });
      expect(screen.queryByText(/ak start/i)).not.toBeInTheDocument();
    });

    it("shows the Open Daemon connection settings button", () => {
      renderModal({ machines: [] });
      expect(screen.getByRole("button", { name: /open daemon connection settings/i })).toBeInTheDocument();
    });

    it("navigates to /settings/daemon-connection on settings button click", async () => {
      const { onClose } = renderModal({ machines: [] });
      fireEvent.click(screen.getByRole("button", { name: /open daemon connection settings/i }));
      expect(onClose).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/settings/daemon-connection");
    });
  });
});
