import type { BacklogItem, BacklogItemPriority } from "@agent-kanban/shared";
import { BACKLOG_ITEM_PRIORITIES } from "@agent-kanban/shared";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

export type BacklogItemFormMode = "create" | "edit";

interface BacklogItemFormProps {
  mode: BacklogItemFormMode;
  open: boolean;
  initialItem?: BacklogItem | null;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: { title: string; description: string | null; priority: BacklogItemPriority }) => void;
}

export function BacklogItemForm({ mode, open, initialItem, pending = false, error, onClose, onSubmit }: BacklogItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<BacklogItemPriority>("P2");

  useEffect(() => {
    if (open) {
      setTitle(initialItem?.title ?? "");
      setDescription(initialItem?.description ?? "");
      setPriority(initialItem?.priority ?? "P2");
    }
  }, [open, initialItem]);

  function handleSubmit() {
    if (!title.trim() || pending) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      priority,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add backlog item" : "Edit backlog item"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary" htmlFor="backlog-item-title">
              Title
            </Label>
            <Input id="backlog-item-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Backlog item title" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary" htmlFor="backlog-item-description">
              Description
            </Label>
            <Textarea
              id="backlog-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-content-tertiary" htmlFor="backlog-item-priority">
              Priority
            </Label>
            <Select value={priority} onValueChange={(v) => v && setPriority(v as BacklogItemPriority)}>
              <SelectTrigger id="backlog-item-priority" className="w-full" aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BACKLOG_ITEM_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-xs text-error">{error}</p>}

        <DialogFooter className="flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !title.trim()}>
            {pending ? "Saving..." : mode === "create" ? "Add item" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
