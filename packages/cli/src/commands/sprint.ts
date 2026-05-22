import { isSprintStatus } from "@agent-kanban/shared";
import type { Command } from "commander";
import { createClient } from "../agent/leader.js";
import type { ApiClient } from "../client/index.js";
import { ApiError } from "../client/index.js";
import { formatSprint, formatSprintList, getOutputFormat, output } from "../output.js";

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

export function registerSprintCommand(program: Command) {
  const sprintCmd = program.command("sprint").description("Manage sprints (open, close, list)");

  sprintCmd
    .command("open <theme>")
    .description("Open a new sprint with the given theme (creates planning sprint then transitions to active)")
    .option("--board <id>", "Board ID (defaults to the only board if there is one)")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (theme: string, opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);
      const boardId = await resolveBoardId(client, opts.board);

      const created = await client.createSprint(boardId, { theme });
      const active = await client.transitionSprint(created.id, "active");

      output(active, fmt, (s: any) => `Opened S${s.number}: ${s.theme}`, { kind: "sprint" });
    });

  sprintCmd
    .command("close [id]")
    .description("Close the active sprint on a board (or a specific sprint by ID)")
    .option("--board <id>", "Board ID (defaults to the only board if there is one)")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (id: string | undefined, opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);

      let sprintId = id;
      if (!sprintId) {
        const boardId = await resolveBoardId(client, opts.board);
        try {
          const active = await client.getActiveSprint(boardId);
          sprintId = active.id;
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            console.error(`No active sprint on board ${boardId}`);
            process.exit(1);
          }
          throw err;
        }
      }

      const closed = await client.transitionSprint(sprintId, "closed");
      output(closed, fmt, (s: any) => `Closed S${s.number}: ${s.theme}`, { kind: "sprint" });
    });

  sprintCmd
    .command("list")
    .description("List sprints on a board")
    .option("--board <id>", "Board ID (defaults to the only board if there is one)")
    .option("--status <status>", "Filter by status: planning, active, closed")
    .option("-o, --output <format>", "Output format (json, yaml, text)")
    .action(async (opts) => {
      const client = await createClient();
      const fmt = getOutputFormat(opts.output);
      const boardId = await resolveBoardId(client, opts.board);

      const params: { status?: ReturnType<typeof normalizeStatus> } = {};
      if (opts.status) params.status = normalizeStatus(opts.status);

      const sprints = await client.listSprints(boardId, params);
      output(sprints, fmt, formatSprintList, { kind: "sprint" });
    });
}

function normalizeStatus(value: string) {
  if (!isSprintStatus(value)) {
    console.error(`--status must be one of: planning, active, closed (got "${value}")`);
    process.exit(1);
  }
  return value;
}

// Re-export formatter for tests
export { formatSprint, formatSprintList };
