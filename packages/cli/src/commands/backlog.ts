import {
  type BacklogItemStatus,
  type CreateBacklogItemInput,
  isBacklogItemPriority,
  isBacklogItemStatus,
  type UpdateBacklogItemInput,
} from "@agent-kanban/shared";
import type { Command } from "commander";
import { createClient } from "../agent/leader.js";
import type { ApiClient } from "../client/index.js";
import { formatBacklog, formatBacklogList, getOutputFormat, output } from "../output.js";

async function resolveBoardId(client: ApiClient, explicit?: string): Promise<string> {
  if (explicit) return explicit;
  const boards = await client.listBoards();
  if (boards.length === 0) {
    console.error("No boards found. Create one with `ak create board` first.");
    process.exit(1);
  }
  if (boards.length > 1) {
    console.error("Multiple boards found. Pass --board <id> to disambiguate.");
    process.exit(1);
  }
  return boards[0].id;
}

function normalizePriority(value: string) {
  if (!isBacklogItemPriority(value)) {
    console.error(`--priority must be one of: P0, P1, P2, P3 (got "${value}")`);
    process.exit(1);
  }
  return value;
}

function normalizeCreateStatus(value: string) {
  if (value !== "idea" && value !== "in_planning") {
    console.error(`--status must be one of: idea, in_planning (got "${value}")`);
    process.exit(1);
  }
  return value;
}

function normalizeStatus(value: string): BacklogItemStatus {
  if (!isBacklogItemStatus(value)) {
    console.error(`--status must be one of: idea, in_planning, consumed, dropped (got "${value}")`);
    process.exit(1);
  }
  return value;
}

export function registerBacklogCommand(program: Command) {
  const backlogCmd = program.command("backlog").description("Manage product backlog items (add, list, update, delete)");

  backlogCmd
    .command("add <title>")
    .description("Add a new backlog item to a board")
    .requiredOption("--priority <P0|P1|P2|P3>", "Priority of the backlog item")
    .option("--board <id>", "Board ID (defaults to the only board if there is one)")
    .option("--description <text>", "Description of the backlog item")
    .option("--status <idea|in_planning>", "Initial status (default: idea)")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (title: string, opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);
      const boardId = await resolveBoardId(client, opts.board);

      const input: CreateBacklogItemInput = {
        title,
        priority: normalizePriority(opts.priority),
      };
      if (opts.description !== undefined) input.description = opts.description;
      if (opts.status !== undefined) input.status = normalizeCreateStatus(opts.status);

      const item = await client.createBacklogItem(boardId, input);
      output(item, fmt, formatBacklog, { kind: "backlogItem" });
    });

  backlogCmd
    .command("list")
    .description("List backlog items on a board (newest first)")
    .option("--board <id>", "Board ID (defaults to the only board if there is one)")
    .option("--status <status>", "Filter by status: idea, in_planning, consumed, dropped")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);
      const boardId = await resolveBoardId(client, opts.board);

      const params: { status?: BacklogItemStatus } = {};
      if (opts.status) params.status = normalizeStatus(opts.status);

      const items = await client.listBacklogItems(boardId, params);
      output(items, fmt, formatBacklogList, { kind: "backlogItem" });
    });

  backlogCmd
    .command("update <id>")
    .description("Update a backlog item (at least one field required)")
    .option("--title <title>", "New title")
    .option("--description <text>", "New description (empty string clears)")
    .option("--priority <P0|P1|P2|P3>", "New priority")
    .option("--status <idea|in_planning|consumed|dropped>", "New status")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (id: string, opts) => {
      const fmt = getOutputFormat(opts.output);

      const patch: UpdateBacklogItemInput = {};
      if (opts.title !== undefined) patch.title = opts.title;
      if (opts.description !== undefined) patch.description = opts.description === "" ? null : opts.description;
      if (opts.priority !== undefined) patch.priority = normalizePriority(opts.priority);
      if (opts.status !== undefined) patch.status = normalizeStatus(opts.status);

      if (Object.keys(patch).length === 0) {
        console.error("At least one of --title, --description, --priority, or --status is required");
        process.exit(1);
      }

      const client = await createClient();
      const item = await client.updateBacklogItem(id, patch);
      output(item, fmt, formatBacklog, { kind: "backlogItem" });
    });

  backlogCmd
    .command("delete <id>")
    .description("Delete a backlog item")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (id: string, opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);
      const result = await client.deleteBacklogItem(id);
      output(result, fmt, () => `Deleted backlog item ${id}`);
    });
}

// Re-export formatters for tests
export { formatBacklog, formatBacklogList };
