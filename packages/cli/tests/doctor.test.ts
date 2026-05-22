// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { type CheckResult, checkDevVars, checkGpg, checkMigrations, checkWorktreeSymlinks, formatResults } from "../src/commands/doctor.js";

function fakeFs(opts: {
  files?: Record<string, "file" | "dir" | "symlink-to-file" | "symlink-to-dir" | "missing">;
  readdir?: Record<string, string[]>;
}) {
  const files = opts.files ?? {};
  const readdir = opts.readdir ?? {};
  return {
    existsSync: (p: string) => files[p] !== undefined && files[p] !== "missing",
    statSync: (p: string) => {
      const k = files[p];
      if (!k || k === "missing") throw new Error(`ENOENT ${p}`);
      const isDir = k === "dir" || k === "symlink-to-dir";
      const isFile = k === "file" || k === "symlink-to-file";
      return {
        isFile: () => isFile,
        isDirectory: () => isDir,
      } as any;
    },
    lstatSync: (p: string) => {
      const k = files[p];
      const isLink = k === "symlink-to-file" || k === "symlink-to-dir";
      return { isSymbolicLink: () => isLink } as any;
    },
    readdirSync: (p: string) => readdir[p] ?? [],
  };
}

describe("checkGpg", () => {
  it("returns OK when gpg is installed and a secret key is present", () => {
    const spawn = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === "--version") return { status: 0, stdout: "gpg (GnuPG) 2.4.0" };
      if (args[0] === "--list-secret-keys") return { status: 0, stdout: "sec:u:4096:1:ABCDEF::::::scESC:::+:::23::0:\n" };
      return { status: 1, stdout: "" };
    });
    const r = checkGpg({ spawn: spawn as any });
    expect(r.status).toBe("OK");
  });

  it("returns FAIL when gpg --version fails", () => {
    const spawn = vi.fn().mockReturnValue({ status: 127, stdout: "" });
    const r = checkGpg({ spawn: spawn as any });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/gpg/i);
  });

  it("returns FAIL when no secret keys are listed", () => {
    const spawn = vi.fn().mockImplementation((_cmd: string, args: string[]) => {
      if (args[0] === "--version") return { status: 0, stdout: "gpg" };
      return { status: 0, stdout: "" }; // no sec: lines
    });
    const r = checkGpg({ spawn: spawn as any });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/no gpg secret keys/i);
  });
});

describe("checkDevVars", () => {
  const repoRoot = "/repo";
  const path = "/repo/apps/web/.dev.vars";

  it("returns OK when .dev.vars is a regular file", () => {
    const fs = fakeFs({ files: { [path]: "file" } });
    const r = checkDevVars({ fs, repoRoot });
    expect(r.status).toBe("OK");
  });

  it("returns OK when .dev.vars is a symlink to a file", () => {
    const fs = fakeFs({ files: { [path]: "symlink-to-file" } });
    const r = checkDevVars({ fs, repoRoot });
    expect(r.status).toBe("OK");
  });

  it("returns FAIL when .dev.vars is missing", () => {
    const fs = fakeFs({ files: { [path]: "missing" } });
    const r = checkDevVars({ fs, repoRoot });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/not found/);
  });

  it("FAIL output never reads or echoes the file's contents", () => {
    const fs = fakeFs({ files: { [path]: "missing" } });
    const r = checkDevVars({ fs, repoRoot });
    // Only existence/readability is reported. Values like quoted strings or '=' assignments must not appear.
    expect(r.message).not.toMatch(/=/);
    expect(r.message).not.toMatch(/["']/);
  });
});

describe("checkMigrations", () => {
  const repoRoot = "/repo";
  const migrationsDir = "/repo/apps/web/migrations";
  const d1Root = "/repo/apps/web/.wrangler/state/v3/d1";
  const dbDir = `${d1Root}/miniflare-D1DatabaseObject`;
  const dbFile = `${dbDir}/data.sqlite`;

  it("returns OK when filesystem migrations match d1_migrations rows", () => {
    const fs = fakeFs({
      files: {
        [d1Root]: "dir",
        [dbDir]: "dir",
        [dbFile]: "file",
      },
      readdir: {
        [migrationsDir]: ["0001_initial.sql", "0002_thing.sql", "README.md"],
        [d1Root]: ["miniflare-D1DatabaseObject"],
        [dbDir]: ["data.sqlite", "metadata.sqlite"],
      },
    });
    const sqlite = vi.fn().mockReturnValue({ ok: true, rows: ["0001_initial.sql", "0002_thing.sql"] });
    const r = checkMigrations({ fs, repoRoot, sqlite });
    expect(r.status).toBe("OK");
    expect(r.message).toMatch(/2 migrations/);
  });

  it("returns FAIL when a committed migration has not been applied", () => {
    const fs = fakeFs({
      files: { [d1Root]: "dir", [dbDir]: "dir", [dbFile]: "file" },
      readdir: {
        [migrationsDir]: ["0001_initial.sql", "0002_thing.sql"],
        [d1Root]: ["miniflare-D1DatabaseObject"],
        [dbDir]: ["data.sqlite"],
      },
    });
    const sqlite = vi.fn().mockReturnValue({ ok: true, rows: ["0001_initial.sql"] });
    const r = checkMigrations({ fs, repoRoot, sqlite });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/missing.*0002_thing\.sql/);
  });

  it("returns FAIL when D1 has unexpected migrations not in repo", () => {
    const fs = fakeFs({
      files: { [d1Root]: "dir", [dbDir]: "dir", [dbFile]: "file" },
      readdir: {
        [migrationsDir]: ["0001_initial.sql"],
        [d1Root]: ["miniflare-D1DatabaseObject"],
        [dbDir]: ["data.sqlite"],
      },
    });
    const sqlite = vi.fn().mockReturnValue({ ok: true, rows: ["0001_initial.sql", "9999_rogue.sql"] });
    const r = checkMigrations({ fs, repoRoot, sqlite });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/unexpected.*9999_rogue\.sql/);
  });

  it("returns WARN when no Wrangler D1 state exists", () => {
    const fs = fakeFs({
      files: { [d1Root]: "missing" },
      readdir: { [migrationsDir]: ["0001_initial.sql"] },
    });
    const sqlite = vi.fn();
    const r = checkMigrations({ fs, repoRoot, sqlite });
    expect(r.status).toBe("WARN");
    expect(sqlite).not.toHaveBeenCalled();
  });

  it("returns WARN when sqlite query fails", () => {
    const fs = fakeFs({
      files: { [d1Root]: "dir", [dbDir]: "dir", [dbFile]: "file" },
      readdir: {
        [migrationsDir]: ["0001_initial.sql"],
        [d1Root]: ["miniflare-D1DatabaseObject"],
        [dbDir]: ["data.sqlite"],
      },
    });
    const sqlite = vi.fn().mockReturnValue({ ok: false, error: "sqlite3 not found" });
    const r = checkMigrations({ fs, repoRoot, sqlite });
    expect(r.status).toBe("WARN");
  });
});

describe("checkWorktreeSymlinks", () => {
  it("returns OK with N/A message when not in a worktree", () => {
    const r = checkWorktreeSymlinks({ repoRoot: "/Users/dev/agent-kanban", cwd: "/Users/dev/agent-kanban" });
    expect(r.status).toBe("OK");
    expect(r.message).toMatch(/N\/A/);
  });

  it("returns OK when all expected symlinks exist", () => {
    const repoRoot = "/Users/dev/agent-kanban/.worktrees/track-x";
    const fs = fakeFs({
      files: {
        [`${repoRoot}/node_modules`]: "symlink-to-dir",
        [`${repoRoot}/apps/web/node_modules`]: "symlink-to-dir",
        [`${repoRoot}/packages/shared/node_modules`]: "symlink-to-dir",
        [`${repoRoot}/packages/cli/node_modules`]: "symlink-to-dir",
      },
    });
    const r = checkWorktreeSymlinks({ repoRoot, cwd: repoRoot, fs });
    expect(r.status).toBe("OK");
  });

  it("returns FAIL when an expected symlink is missing", () => {
    const repoRoot = "/Users/dev/agent-kanban/.worktrees/track-x";
    const fs = fakeFs({
      files: {
        [`${repoRoot}/node_modules`]: "symlink-to-dir",
        [`${repoRoot}/apps/web/node_modules`]: "missing",
        [`${repoRoot}/packages/shared/node_modules`]: "symlink-to-dir",
        [`${repoRoot}/packages/cli/node_modules`]: "symlink-to-dir",
      },
    });
    const r = checkWorktreeSymlinks({ repoRoot, cwd: repoRoot, fs });
    expect(r.status).toBe("FAIL");
    expect(r.message).toMatch(/apps\/web\/node_modules/);
  });
});

describe("formatResults", () => {
  it("renders status, name, message and remediation for FAIL rows", () => {
    const results: CheckResult[] = [
      { name: "Check A", status: "OK", message: "fine" },
      { name: "Check B", status: "FAIL", message: "broken", remediation: "fix it" },
    ];
    const out = formatResults(results);
    expect(out).toMatch(/\[OK/);
    expect(out).toMatch(/\[FAIL/);
    expect(out).toMatch(/Check A/);
    expect(out).toMatch(/Check B/);
    expect(out).toMatch(/→ fix it/);
    expect(out).toMatch(/1 check\(s\) failed/);
  });

  it("reports all-passed when there are no FAIL or WARN results", () => {
    const results: CheckResult[] = [{ name: "x", status: "OK", message: "" }];
    expect(formatResults(results)).toMatch(/All checks passed\./);
  });

  it("does not include remediation for OK rows", () => {
    const results: CheckResult[] = [{ name: "x", status: "OK", message: "fine", remediation: "should not show" }];
    expect(formatResults(results)).not.toMatch(/should not show/);
  });
});
