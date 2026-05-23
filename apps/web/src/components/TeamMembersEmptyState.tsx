import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "./ui/button";

interface TeamMembersEmptyStateProps {
  onAddTeamMember: () => void;
}

export function TeamMembersEmptyState({ onAddTeamMember }: TeamMembersEmptyStateProps) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  async function handleAddBacklogItems() {
    setCreating(true);
    try {
      const boards = await api.boards.list();
      if (boards.length > 0) {
        navigate(`/boards/${boards[0].id}/backlog`);
        return;
      }
      const created = await api.boards.create({ name: "My Board", type: "dev", theme: "" });
      navigate(`/boards/${created.id}/backlog`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create board");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex size-14 items-center justify-center rounded-xl border border-border bg-surface-secondary text-content-tertiary">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>

      <h2 className="text-xl font-bold text-content-primary">Build your team</h2>
      <p className="mt-2 max-w-md text-sm text-content-secondary">
        Agent Kanban works by assigning tasks to AI agents on your board. Recruit built-in agents or add your own, then feed them work from the
        backlog.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button onClick={handleAddBacklogItems} disabled={creating}>
          {creating ? "Creating board..." : "Add backlog items"}
        </Button>
        <Button variant="outline" onClick={() => navigate("/boards/new")}>
          Create board
        </Button>
      </div>

      <p className="mt-6 text-xs text-content-tertiary">
        Or{" "}
        <button type="button" onClick={onAddTeamMember} className="text-accent underline-offset-2 hover:underline">
          recruit an agent
        </button>{" "}
        to get started.
      </p>
    </div>
  );
}
