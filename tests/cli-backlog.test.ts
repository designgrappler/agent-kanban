// @vitest-environment node
import { describe, expect, it } from "vitest";

async function importCommand() {
  const { Command } = await import("../packages/cli/node_modules/commander/esm.mjs");
  return Command;
}

/**
 * Tests for the `ak backlog` subcommand tree.
 *
 * Strategy:
 * - Verify ApiClient has backlog methods with the expected arity and that they
 *   build the right URLs/bodies (contract tests, no live HTTP).
 * - Verify the backlog subcommand registers `add`, `list`, `update`, `delete`.
 * - Verify the formatter renders backlog rows.
 */

describe("ApiClient backlog methods — public contract", () => {
  it("createBacklogItem exists and has arity 2 (boardId, input)", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).createBacklogItem).toBe("function");
    expect((ApiClient.prototype as any).createBacklogItem.length).toBe(2);
  });

  it("listBacklogItems exists and accepts boardId", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).listBacklogItems).toBe("function");
    expect((ApiClient.prototype as any).listBacklogItems.length).toBeGreaterThanOrEqual(1);
  });

  it("getBacklogItem exists and accepts id", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).getBacklogItem).toBe("function");
    expect((ApiClient.prototype as any).getBacklogItem.length).toBe(1);
  });

  it("updateBacklogItem exists with arity 2 (id, patch)", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).updateBacklogItem).toBe("function");
    expect((ApiClient.prototype as any).updateBacklogItem.length).toBe(2);
  });

  it("deleteBacklogItem exists and accepts id", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).deleteBacklogItem).toBe("function");
    expect((ApiClient.prototype as any).deleteBacklogItem.length).toBe(1);
  });
});

describe("ApiClient backlog methods — request shape", () => {
  async function makeClient() {
    const { ApiClient } = await import("../packages/cli/src/client/index");

    class TestClient extends (ApiClient as any) {
      protected async authorize() {
        return "Bearer test";
      }
    }
    const client = new TestClient("http://example.test");
    return client as unknown as InstanceType<typeof ApiClient>;
  }

  it("createBacklogItem POSTs /api/boards/:id/backlog-items with input body", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      captured.body = init?.body;
      return new Response(
        JSON.stringify({
          id: "bli_1",
          board_id: "brd_1",
          title: "Add dark mode",
          description: null,
          priority: "P1",
          status: "idea",
          created_by: "user_1",
          created_at: "2026-05-21T12:00:00.000Z",
          updated_at: "2026-05-21T12:00:00.000Z",
          consumed_at: null,
          consumed_into_task_id: null,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    try {
      const result = await (client as any).createBacklogItem("brd_1", { title: "Add dark mode", priority: "P1" });
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/backlog-items");
      expect(captured.method).toBe("POST");
      expect(JSON.parse(captured.body)).toEqual({ title: "Add dark mode", priority: "P1" });
      expect(result.id).toBe("bli_1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("listBacklogItems with status appends ?status= to URL", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      captured.url = url;
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }) as any;

    try {
      await (client as any).listBacklogItems("brd_1", { status: "idea" });
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/backlog-items?status=idea");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("listBacklogItems without status omits query string", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      captured.url = url;
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }) as any;

    try {
      await (client as any).listBacklogItems("brd_1");
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/backlog-items");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getBacklogItem GETs /api/backlog-items/:id", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      return new Response(JSON.stringify({ id: "bli_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      await (client as any).getBacklogItem("bli_1");
      expect(captured.url).toBe("http://example.test/api/backlog-items/bli_1");
      expect(captured.method).toBe("GET");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("updateBacklogItem PATCHes /api/backlog-items/:id with patch body", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      captured.body = init?.body;
      return new Response(
        JSON.stringify({ id: "bli_1", title: "Renamed", priority: "P0", status: "consumed", consumed_at: "2026-05-21T12:00:00.000Z" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    try {
      const result = await (client as any).updateBacklogItem("bli_1", { title: "Renamed", status: "consumed" });
      expect(captured.url).toBe("http://example.test/api/backlog-items/bli_1");
      expect(captured.method).toBe("PATCH");
      expect(JSON.parse(captured.body)).toEqual({ title: "Renamed", status: "consumed" });
      expect(result.consumed_at).toBe("2026-05-21T12:00:00.000Z");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("deleteBacklogItem DELETEs /api/backlog-items/:id", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      await (client as any).deleteBacklogItem("bli_1");
      expect(captured.url).toBe("http://example.test/api/backlog-items/bli_1");
      expect(captured.method).toBe("DELETE");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("registerBacklogCommand", () => {
  it("registers add, list, update, and delete subcommands", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    registerBacklogCommand(program);

    const backlogCmd = program.commands.find((c: any) => c.name() === "backlog");
    expect(backlogCmd).toBeDefined();

    const subNames = backlogCmd!.commands.map((c: any) => c.name()).sort();
    expect(subNames).toEqual(["add", "delete", "list", "update"]);
  });

  it("add requires <title> positional and --priority flag", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    registerBacklogCommand(program);
    const backlogCmd = program.commands.find((c: any) => c.name() === "backlog")!;
    const addCmd = backlogCmd.commands.find((c: any) => c.name() === "add")!;
    expect(addCmd.usage()).toContain("<title>");
    const priorityOpt = addCmd.options.find((o: any) => o.long === "--priority");
    expect(priorityOpt).toBeDefined();
    expect(priorityOpt!.required).toBe(true);
  });

  it("update has flags for title, description, priority, status", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    registerBacklogCommand(program);
    const backlogCmd = program.commands.find((c: any) => c.name() === "backlog")!;
    const updateCmd = backlogCmd.commands.find((c: any) => c.name() === "update")!;
    const flags = updateCmd.options.map((o: any) => o.long);
    expect(flags).toContain("--title");
    expect(flags).toContain("--description");
    expect(flags).toContain("--priority");
    expect(flags).toContain("--status");
  });

  it("list exposes --board, --status, and -o flags", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    registerBacklogCommand(program);
    const backlogCmd = program.commands.find((c: any) => c.name() === "backlog")!;
    const listCmd = backlogCmd.commands.find((c: any) => c.name() === "list")!;
    const flags = listCmd.options.map((o: any) => o.long);
    expect(flags).toContain("--board");
    expect(flags).toContain("--status");
    expect(flags).toContain("--output");
  });

  it("update rejects invalid --status via parse error", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    program.exitOverride();
    registerBacklogCommand(program);

    // Stub createClient + ApiClient by intercepting process.exit; with no network the action
    // call would fail before exit, but normalizeStatus runs synchronously and calls process.exit(1).
    const originalExit = process.exit;
    let exitCode: number | undefined;
    const originalErr = console.error;
    const errs: string[] = [];
    console.error = (msg: any) => {
      errs.push(String(msg));
    };
    (process as any).exit = ((code?: number) => {
      exitCode = code;
      throw new Error("__EXIT__");
    }) as any;

    try {
      await program.parseAsync(["node", "ak", "backlog", "update", "bli_1", "--status", "bogus"]);
    } catch (err: any) {
      expect(err.message).toBe("__EXIT__");
    } finally {
      process.exit = originalExit;
      console.error = originalErr;
    }

    expect(exitCode).toBe(1);
    expect(errs.some((e) => e.includes("--status must be one of"))).toBe(true);
  });

  it("update with no fields exits 1 with a clear error", async () => {
    const { registerBacklogCommand } = await import("../packages/cli/src/commands/backlog");
    const Command = await importCommand();
    const program = new Command();
    program.exitOverride();
    registerBacklogCommand(program);

    const originalExit = process.exit;
    let exitCode: number | undefined;
    const originalErr = console.error;
    const errs: string[] = [];
    console.error = (msg: any) => {
      errs.push(String(msg));
    };
    (process as any).exit = ((code?: number) => {
      exitCode = code;
      throw new Error("__EXIT__");
    }) as any;

    try {
      await program.parseAsync(["node", "ak", "backlog", "update", "bli_1"]);
    } catch (err: any) {
      expect(err.message).toBe("__EXIT__");
    } finally {
      process.exit = originalExit;
      console.error = originalErr;
    }

    expect(exitCode).toBe(1);
    expect(errs.some((e) => e.includes("At least one of"))).toBe(true);
  });
});

describe("formatBacklogList", () => {
  it("returns 'No backlog items found.' when empty", async () => {
    const { formatBacklogList } = await import("../packages/cli/src/output");
    expect(formatBacklogList([])).toBe("No backlog items found.");
  });

  it("renders one row per item with id, priority, status, title", async () => {
    const { formatBacklogList } = await import("../packages/cli/src/output");
    const items = [
      {
        id: "bli_1",
        title: "Add dark mode",
        priority: "P1",
        status: "idea",
      },
      {
        id: "bli_2",
        title: "Refactor router",
        priority: "P2",
        status: "in_planning",
      },
    ];
    const out = formatBacklogList(items);
    expect(out).toContain("bli_1");
    expect(out).toContain("[P1]");
    expect(out).toContain("[idea]");
    expect(out).toContain("Add dark mode");
    expect(out).toContain("bli_2");
    expect(out).toContain("[P2]");
    expect(out).toContain("[in_planning]");
    expect(out).toContain("Refactor router");
  });
});

describe("formatBacklog", () => {
  it("renders header with title, ID, board, priority, status", async () => {
    const { formatBacklog } = await import("../packages/cli/src/output");
    const item = {
      id: "bli_1",
      board_id: "brd_1",
      title: "Add dark mode",
      description: "Toggle in settings",
      priority: "P1",
      status: "idea",
      created_by: "user_1",
      created_at: "2026-05-21T12:00:00.000Z",
      updated_at: "2026-05-21T12:00:00.000Z",
      consumed_at: null,
      consumed_into_task_id: null,
    };
    const out = formatBacklog(item);
    expect(out).toContain("Add dark mode");
    expect(out).toContain("bli_1");
    expect(out).toContain("brd_1");
    expect(out).toContain("P1");
    expect(out).toContain("idea");
    expect(out).toContain("user_1");
    expect(out).toContain("Toggle in settings");
  });
});
