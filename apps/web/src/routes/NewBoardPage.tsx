import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DaemonHandoffModal } from "../components/board/DaemonHandoffModal";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { useCreateBoard } from "../hooks/useBoard";
import { useMachines } from "../hooks/useMachines";
import { api } from "../lib/api";

export function NewBoardPage() {
  const navigate = useNavigate();
  const [boardName, setBoardName] = useState("My Board");
  const [boardTheme, setBoardTheme] = useState("");
  const [error, setError] = useState("");
  const [handoffModal, setHandoffModal] = useState<{ open: boolean; boardId: string }>({ open: false, boardId: "" });
  const createBoard = useCreateBoard();
  const { machines } = useMachines();

  async function handleCreateBoard() {
    setError("");
    try {
      const { next_number } = await api.sprints.getNextNumber();
      const prefixedName = `S${next_number}-${boardName.trim()}`;
      const board = await createBoard.mutateAsync({ name: prefixedName, type: "dev", theme: boardTheme || undefined });
      setHandoffModal({ open: true, boardId: board.id });
    } catch {
      setError("Failed to create board. Please try again.");
    }
  }

  function handleModalClose() {
    const boardId = handoffModal.boardId;
    setHandoffModal((prev) => ({ ...prev, open: false }));
    navigate(`/boards/${boardId}`, { replace: true });
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full space-y-6 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-content-primary">
              Agent <span className="text-accent">Kanban</span>
            </h1>
            <p className="text-sm text-content-secondary mt-2">Your AI workforce starts here.</p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-medium text-content-tertiary uppercase tracking-wide">Sprint board name</label>
            <Input value={boardName} onChange={(e) => setBoardName(e.target.value)} />
            <label className="block text-xs font-medium text-content-tertiary uppercase tracking-wide">Sprint theme</label>
            <Textarea
              value={boardTheme}
              onChange={(e) => setBoardTheme(e.target.value)}
              placeholder="Describe the purpose of this sprint."
              rows={3}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button onClick={handleCreateBoard} disabled={createBoard.isPending || !boardName.trim()} className="w-full">
              {createBoard.isPending ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </div>
      </div>

      <DaemonHandoffModal open={handoffModal.open} onClose={handleModalClose} boardId={handoffModal.boardId} machines={machines} />
    </div>
  );
}
