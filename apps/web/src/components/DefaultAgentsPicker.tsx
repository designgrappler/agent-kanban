import { BUILTIN_TEAM_MEMBERS, type TeamMemberTemplate } from "@agent-kanban/shared";
import { useState } from "react";
import { useCreateTeamMember } from "../hooks/useTeamMembers";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";

interface DefaultAgentsPickerProps {
  open: boolean;
  onClose: () => void;
}

export function DefaultAgentsPicker({ open, onClose }: DefaultAgentsPickerProps) {
  const [selected, setSelected] = useState<TeamMemberTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const createTeamMember = useCreateTeamMember();

  function handleClose() {
    setSelected(null);
    setError(null);
    onClose();
  }

  async function handleAdd() {
    if (!selected) return;
    setError(null);
    try {
      await createTeamMember.mutateAsync({
        display_name: selected.display_name,
        role: selected.role,
        bio: selected.bio,
        soul: selected.soul,
        capabilities: selected.capabilities,
        handoff_to: selected.handoff_to ?? undefined,
        skills: selected.skills ?? undefined,
        builtin: true,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agent");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add default agent</DialogTitle>
          <DialogDescription>Select a built-in agent to add to your team.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {BUILTIN_TEAM_MEMBERS.map((tpl) => (
            <button
              key={tpl.username}
              type="button"
              onClick={() => setSelected(tpl)}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selected?.username === tpl.username
                  ? "border-accent bg-accent/10 text-content-primary"
                  : "border-border bg-surface-secondary text-content-secondary hover:border-border/80 hover:bg-surface-tertiary"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-primary font-mono text-sm font-semibold text-content-primary"
                >
                  {tpl.display_name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-content-primary">{tpl.display_name}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-content-tertiary">@{tpl.username}</p>
                  {tpl.role && (
                    <span className="mt-1 inline-block rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary">
                      {tpl.role}
                    </span>
                  )}
                  {tpl.description && <p className="mt-1.5 text-xs text-content-secondary line-clamp-2">{tpl.description}</p>}
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-xs text-error" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selected || createTeamMember.isPending}>
            {createTeamMember.isPending ? "Adding..." : "Add agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
