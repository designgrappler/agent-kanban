import type { BacklogItem, BacklogItemPriority } from "@agent-kanban/shared";
import { BACKLOG_ITEM_PRIORITIES } from "@agent-kanban/shared";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BacklogItemForm, type BacklogItemFormMode } from "../components/BacklogItemForm";
import { BacklogPriorityGroup } from "../components/BacklogPriorityGroup";
import { Header } from "../components/Header";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { useBacklogItems, useCreateBacklogItem, useDeleteBacklogItem, useUpdateBacklogItem } from "../hooks/useBacklogItems";
import { useBoard } from "../hooks/useBoard";

export function BacklogPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const { board, loading: boardLoading } = useBoard(boardId);
  const { data: items = [], isLoading: itemsLoading, error: itemsError } = useBacklogItems(boardId);
  const createItem = useCreateBacklogItem(boardId);
  const updateItem = useUpdateBacklogItem(boardId);
  const deleteItem = useDeleteBacklogItem(boardId);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<BacklogItemFormMode>("create");
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BacklogItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<BacklogItemPriority, BacklogItem[]> = { P0: [], P1: [], P2: [], P3: [] };
    for (const item of items) map[item.priority].push(item);
    return map;
  }, [items]);

  function openCreate() {
    setFormError(null);
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: BacklogItem) {
    setFormError(null);
    setFormMode("edit");
    setEditingItem(item);
    setFormOpen(true);
  }

  async function handleSubmit(input: { title: string; description: string | null; priority: BacklogItemPriority }) {
    setFormError(null);
    try {
      if (formMode === "create") {
        await createItem.mutateAsync({ title: input.title, description: input.description, priority: input.priority });
      } else if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id,
          patch: { title: input.title, description: input.description, priority: input.priority },
        });
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to save backlog item");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteItem.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Unable to delete backlog item");
    }
  }

  if (boardLoading) return <BacklogLoading />;
  if (!board || !boardId) return <BacklogNotFound />;

  const errorMessage = itemsError ? (itemsError instanceof Error ? itemsError.message : "Unable to load backlog") : null;

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <main className="mx-auto max-w-2xl p-6 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-content-tertiary">{board.name}</p>
            <h1 className="mt-1 text-xl font-bold text-content-primary">Backlog</h1>
            <p className="mt-1 text-xs text-content-tertiary">Capture and groom ideas before they become tasks.</p>
          </div>
          <Button size="sm" onClick={openCreate}>
            Add backlog item
          </Button>
        </div>

        {errorMessage && (
          <p className="mb-4 rounded-md border border-error/40 bg-error/5 px-3 py-2 text-xs text-error" role="alert">
            {errorMessage}
          </p>
        )}

        {itemsLoading ? (
          <div className="space-y-4" aria-label="Loading backlog items">
            <Skeleton className="h-24 rounded-md" />
            <Skeleton className="h-24 rounded-md" />
          </div>
        ) : (
          <div className="space-y-6">
            {BACKLOG_ITEM_PRIORITIES.map((priority) => (
              <BacklogPriorityGroup
                key={priority}
                priority={priority}
                items={grouped[priority]}
                onEdit={openEdit}
                onDelete={(item) => {
                  setDeleteError(null);
                  setDeleteTarget(item);
                }}
              />
            ))}
          </div>
        )}
      </main>

      <BacklogItemForm
        mode={formMode}
        open={formOpen}
        initialItem={editingItem}
        pending={createItem.isPending || updateItem.isPending}
        error={formOpen ? formError : null}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete backlog item</DialogTitle>
            <DialogDescription>
              Delete {deleteTarget ? `"${deleteTarget.title}"` : "this item"} from the backlog. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && <p className="text-xs text-error">{deleteError}</p>}
          <DialogFooter className="flex-col sm:flex-row">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteItem.isPending}>
              {deleteItem.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BacklogLoading() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <main className="mx-auto max-w-2xl space-y-4 p-6 sm:p-8">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-44 rounded-md" />
      </main>
    </div>
  );
}

function BacklogNotFound() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="flex min-h-[60vh] items-center justify-center text-content-tertiary">Board not found</div>
    </div>
  );
}
