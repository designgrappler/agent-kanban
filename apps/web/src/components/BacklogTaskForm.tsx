import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { LabelChip } from "./LabelChip";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface BacklogTaskFormProps {
  mode: "create" | "edit";
  open: boolean;
  boardId: string;
  initialTask?: { id: string; title: string; description?: string | null; labels?: string[] } | null;
  boardLabels: { name: string; color: string; description: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BacklogTaskForm({ mode, open, boardId, initialTask, boardLabels, onClose, onSuccess }: BacklogTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTask?.title ?? "");
      setDescription(initialTask?.description ?? "");
      setSelectedLabels(initialTask?.labels ?? []);
      setError(null);
      setPending(false);
    }
  }, [open]);

  function toggleLabel(name: string) {
    setSelectedLabels((prev) => (prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]));
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setPending(true);
    setError(null);
    try {
      if (mode === "create") {
        await api.tasks.create({
          board_id: boardId,
          title: title.trim(),
          description: description.trim() || undefined,
          labels: selectedLabels.length ? selectedLabels : undefined,
        });
      } else if (initialTask) {
        await api.tasks.update(initialTask.id, {
          title: title.trim(),
          description: description.trim() || null,
          labels: selectedLabels,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add task" : "Edit task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary" htmlFor="task-title">
              Title
            </Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary" htmlFor="task-description">
              Description
            </Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary">Labels</Label>
            {boardLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {boardLabels.map((label) => {
                  const selected = selectedLabels.includes(label.name);
                  return (
                    <button
                      key={label.name}
                      type="button"
                      onClick={() => toggleLabel(label.name)}
                      className={`rounded transition-opacity ${selected ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                      aria-pressed={selected}
                      aria-label={`Toggle label ${label.name}`}
                    >
                      <LabelChip name={label.name} color={label.color} description={label.description} />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-content-tertiary">No labels defined on this board.</p>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <DialogFooter className="flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !title.trim()}>
            {pending ? "Saving..." : mode === "create" ? "Add task" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
