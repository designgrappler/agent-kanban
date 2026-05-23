import { Link } from "react-router-dom";
import { useBoards } from "../../hooks/useBoard";

export function LabelsSection() {
  const { boards } = useBoards();
  const firstBoard = boards[0];

  return (
    <main className="min-w-0 flex-1 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-content-primary">Labels</h1>
        <p className="mt-1 text-sm text-content-secondary">Organize tasks with labels.</p>
      </div>

      <div className="max-w-2xl rounded-lg border border-border bg-surface-secondary p-6 space-y-3">
        <p className="text-sm text-content-primary font-medium">Labels are currently per-board.</p>
        <p className="text-sm text-content-secondary">Manage them in board settings.</p>
        {firstBoard && (
          <Link to={`/boards/${firstBoard.id}/labels`} className="inline-flex items-center text-sm text-accent hover:underline">
            Go to board labels
          </Link>
        )}
      </div>
    </main>
  );
}
