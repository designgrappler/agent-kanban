// @vitest-environment node
import { describe, expect, it } from "vitest";

async function importCommand() {
  const { Command } = await import("../packages/cli/node_modules/commander/esm.mjs");
  return Command;
}

/**
 * Tests for the `ak sprint` subcommand tree.
 *
 * Strategy:
 * - Verify ApiClient has sprint methods with the expected arity and that they
 *   build the right URLs/bodies (contract tests, no live HTTP).
 * - Verify the sprint subcommand registers `open`, `close`, `list`.
 * - Verify the formatter renders sprint rows.
 */

describe("ApiClient sprint methods — public contract", () => {
  it("createSprint exists and has arity 2 (boardId, body)", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).createSprint).toBe("function");
    expect((ApiClient.prototype as any).createSprint.length).toBe(2);
  });

  it("listSprints exists and accepts boardId", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).listSprints).toBe("function");
    expect((ApiClient.prototype as any).listSprints.length).toBeGreaterThanOrEqual(1);
  });

  it("getActiveSprint exists and accepts boardId", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).getActiveSprint).toBe("function");
    expect((ApiClient.prototype as any).getActiveSprint.length).toBe(1);
  });

  it("getSprint exists and accepts sprintId", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).getSprint).toBe("function");
    expect((ApiClient.prototype as any).getSprint.length).toBe(1);
  });

  it("transitionSprint exists with arity 2 (sprintId, status)", async () => {
    const { ApiClient } = await import("../packages/cli/src/client/index");
    expect(typeof (ApiClient.prototype as any).transitionSprint).toBe("function");
    expect((ApiClient.prototype as any).transitionSprint.length).toBe(2);
  });
});

describe("ApiClient sprint methods — request shape", () => {
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

  it("createSprint POSTs /api/boards/:id/sprints with theme body", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      captured.body = init?.body;
      return new Response(JSON.stringify({ id: "sp_1", number: 8, theme: "Foo", status: "planning" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      const result = await (client as any).createSprint("brd_1", { theme: "Foo" });
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/sprints");
      expect(captured.method).toBe("POST");
      expect(JSON.parse(captured.body)).toEqual({ theme: "Foo" });
      expect(result).toEqual({ id: "sp_1", number: 8, theme: "Foo", status: "planning" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("listSprints with status appends ?status= to URL", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      captured.url = url;
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }) as any;

    try {
      await (client as any).listSprints("brd_1", { status: "active" });
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/sprints?status=active");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("listSprints without status omits query string", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      captured.url = url;
      return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }) as any;

    try {
      await (client as any).listSprints("brd_1");
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/sprints");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("getActiveSprint hits /api/boards/:id/sprints/active", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any) => {
      captured.url = url;
      return new Response(JSON.stringify({ id: "sp_1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      await (client as any).getActiveSprint("brd_1");
      expect(captured.url).toBe("http://example.test/api/boards/brd_1/sprints/active");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("transitionSprint PATCHes /api/sprints/:id with status body", async () => {
    const client = await makeClient();
    const captured: any = {};
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init: any) => {
      captured.url = url;
      captured.method = init?.method;
      captured.body = init?.body;
      return new Response(JSON.stringify({ id: "sp_1", status: "active" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as any;

    try {
      await (client as any).transitionSprint("sp_1", "active");
      expect(captured.url).toBe("http://example.test/api/sprints/sp_1");
      expect(captured.method).toBe("PATCH");
      expect(JSON.parse(captured.body)).toEqual({ status: "active" });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("registerSprintCommand", () => {
  it("registers open, close, and list subcommands", async () => {
    const { registerSprintCommand } = await import("../packages/cli/src/commands/sprint");
    const Command = await importCommand();
    const program = new Command();
    registerSprintCommand(program);

    const sprintCmd = program.commands.find((c: any) => c.name() === "sprint");
    expect(sprintCmd).toBeDefined();

    const subNames = sprintCmd!.commands.map((c: any) => c.name()).sort();
    expect(subNames).toEqual(["close", "list", "open"]);
  });

  it("open requires a <theme> positional", async () => {
    const { registerSprintCommand } = await import("../packages/cli/src/commands/sprint");
    const Command = await importCommand();
    const program = new Command();
    registerSprintCommand(program);
    const sprintCmd = program.commands.find((c: any) => c.name() === "sprint")!;
    const openCmd = sprintCmd.commands.find((c: any) => c.name() === "open")!;
    expect(openCmd.usage()).toContain("<theme>");
  });

  it("close has an optional [id] positional", async () => {
    const { registerSprintCommand } = await import("../packages/cli/src/commands/sprint");
    const Command = await importCommand();
    const program = new Command();
    registerSprintCommand(program);
    const sprintCmd = program.commands.find((c: any) => c.name() === "sprint")!;
    const closeCmd = sprintCmd.commands.find((c: any) => c.name() === "close")!;
    expect(closeCmd.usage()).toContain("[id]");
  });

  it("each subcommand exposes --board and -o/--output flags", async () => {
    const { registerSprintCommand } = await import("../packages/cli/src/commands/sprint");
    const Command = await importCommand();
    const program = new Command();
    registerSprintCommand(program);
    const sprintCmd = program.commands.find((c: any) => c.name() === "sprint")!;
    for (const sub of sprintCmd.commands) {
      const flags = sub.options.map((o: any) => o.long);
      expect(flags).toContain("--board");
      expect(flags).toContain("--output");
    }
  });

  it("list exposes a --status flag", async () => {
    const { registerSprintCommand } = await import("../packages/cli/src/commands/sprint");
    const Command = await importCommand();
    const program = new Command();
    registerSprintCommand(program);
    const sprintCmd = program.commands.find((c: any) => c.name() === "sprint")!;
    const listCmd = sprintCmd.commands.find((c: any) => c.name() === "list")!;
    const flags = listCmd.options.map((o: any) => o.long);
    expect(flags).toContain("--status");
  });
});

describe("formatSprintList", () => {
  it("returns 'No sprints found.' when empty", async () => {
    const { formatSprintList } = await import("../packages/cli/src/output");
    expect(formatSprintList([])).toBe("No sprints found.");
  });

  it("renders one row per sprint with id, label, status, theme", async () => {
    const { formatSprintList } = await import("../packages/cli/src/output");
    const sprints = [
      {
        id: "sp_1",
        number: 8,
        theme: "Sprint planning UX",
        status: "active",
        opened_at: "2026-05-21T12:00:00.000Z",
        closed_at: null,
      },
      {
        id: "sp_2",
        number: 7,
        theme: "Earlier work",
        status: "closed",
        opened_at: "2026-05-01T12:00:00.000Z",
        closed_at: "2026-05-15T12:00:00.000Z",
      },
    ];
    const out = formatSprintList(sprints);
    expect(out).toContain("sp_1");
    expect(out).toContain("S8");
    expect(out).toContain("[active]");
    expect(out).toContain("Sprint planning UX");
    expect(out).toContain("sp_2");
    expect(out).toContain("S7");
    expect(out).toContain("[closed]");
    expect(out).toContain("closed=2026-05-15");
  });
});

describe("formatSprint", () => {
  it("renders the sprint header and key fields", async () => {
    const { formatSprint } = await import("../packages/cli/src/output");
    const sprint = {
      id: "sp_1",
      board_id: "brd_1",
      number: 8,
      theme: "Sprint planning UX",
      status: "active",
      opened_at: "2026-05-21T12:00:00.000Z",
      closed_at: null,
      created_by: "user_1",
    };
    const out = formatSprint(sprint);
    expect(out).toContain("S8: Sprint planning UX");
    expect(out).toContain("ID:");
    expect(out).toContain("sp_1");
    expect(out).toContain("brd_1");
    expect(out).toContain("active");
    expect(out).toContain("user_1");
  });
});
