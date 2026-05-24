import type { BacklogItem } from "@agent-kanban/shared";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";

interface CreatePlanButtonProps {
  selectedItems: BacklogItem[];
  onPlanning: () => void | Promise<void>;
}

function buildPlanPrompt(items: BacklogItem[]): string {
  const sorted = [...items].sort((a, b) => a.priority.localeCompare(b.priority));
  const itemLines = sorted
    .map((item) => {
      const title = item.title.trimEnd();
      const description = item.description?.trimEnd() ?? "";
      return description ? `${title}\n${description}` : title;
    })
    .join("\n\n");

  return `Plan a sprint covering these backlog items:\n\n${itemLines}\n\nUse the Architect skill (Peaches). Confirm sprint theme with the user before producing the plan.`;
}

export function CreatePlanButton({ selectedItems, onPlanning }: CreatePlanButtonProps) {
  const disabled = selectedItems.length === 0;

  async function handleClick() {
    if (disabled) return;

    onPlanning();

    const prompt = buildPlanPrompt(selectedItems);

    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Plan prompt copied to clipboard. Paste into your AI coding session.");
    } catch {
      toast.error("Failed to copy to clipboard.");
    }
  }

  return (
    <Button
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled}
      data-testid="create-plan-button"
      title={disabled ? "Select at least one idea item to create a plan" : undefined}
    >
      <Sparkles className="size-3.5 mr-1.5" />
      Create plan
    </Button>
  );
}
