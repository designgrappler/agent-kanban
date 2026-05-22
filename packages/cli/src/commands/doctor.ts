import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import type { Command } from "commander";

export type CheckStatus = "OK" | "WARN" | "FAIL";

export interface CheckResult {
  name: string;
  status: CheckStatus;
  message: string;
  remediation?: string;
}

type SqliteRunner = (dbPath: string, sql: string) => { ok: true; rows: string[] } | { ok: false; error: string };

const defaultSqliteRunner: SqliteRunner = (dbPath, sql) => {
  const result = spawnSync("sqlite3", [dbPath, sql], { encoding: "utf8" });
  if (result.error) return { ok: false, error: result.error.message };
  if (typeof result.status === "number" && result.status !== 0) {
    return { ok: false, error: (result.stderr ?? "").trim() || `sqlite3 exited ${result.status}` };
  }
  const rows = (result.stdout ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return { ok: true, rows };
};

export interface DoctorDeps {
  spawn?: typeof spawnSync;
  fs?: {
    existsSync: (p: string) => boolean;
    statSync: (p: string) => { isFile(): boolean };
    lstatSync: (p: string) => { isSymbolicLink(): boolean };
    readdirSync: (p: string) => string[];
  };
  sqlite?: SqliteRunner;
  cwd?: string;
  repoRoot?: string;
}

const defaultFs = { existsSync, statSync, lstatSync, readdirSync };

function findRepoRoot(start: string): string {
  let dir = start;
  // Walk upward until we find a pnpm-workspace.yaml
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return start;
}

export function checkGpg(deps: DoctorDeps = {}): CheckResult {
  const spawn = deps.spawn ?? spawnSync;
  const versionResult = spawn("gpg", ["--version"], { stdio: "pipe", encoding: "utf8" });
  if (versionResult.error || (typeof versionResult.status === "number" && versionResult.status !== 0)) {
    return {
      name: "gpg installed",
      status: "FAIL",
      message: "gpg is not on PATH or failed to run",
      remediation: "brew install gnupg  |  apt install gnupg  |  https://gnupg.org/download/",
    };
  }
  const keysResult = spawn("gpg", ["--list-secret-keys", "--with-colons"], { stdio: "pipe", encoding: "utf8" });
  if (keysResult.error || (typeof keysResult.status === "number" && keysResult.status !== 0)) {
    return {
      name: "gpg secret key available",
      status: "FAIL",
      message: "could not list gpg secret keys",
      remediation: "gpg --gen-key  (then configure git to sign with the new key)",
    };
  }
  const stdout: string = typeof keysResult.stdout === "string" ? keysResult.stdout : String(keysResult.stdout ?? "");
  const hasSecret = stdout.split("\n").some((line: string) => line.startsWith("sec:"));
  if (!hasSecret) {
    return {
      name: "gpg secret key available",
      status: "FAIL",
      message: "no gpg secret keys found",
      remediation: "gpg --gen-key  (ak start needs a key to sign agent commits)",
    };
  }
  return { name: "gpg installed and key available", status: "OK", message: "gpg present with at least one secret key" };
}

export function checkDevVars(deps: DoctorDeps = {}): CheckResult {
  const fs = deps.fs ?? defaultFs;
  const repoRoot = deps.repoRoot ?? findRepoRoot(deps.cwd ?? process.cwd());
  const path = join(repoRoot, "apps", "web", ".dev.vars");
  if (!fs.existsSync(path)) {
    return {
      name: "apps/web/.dev.vars exists",
      status: "FAIL",
      message: `${path} not found`,
      remediation: "create apps/web/.dev.vars with AUTH_SECRET and OAuth credentials (see docs)",
    };
  }
  let isFile = false;
  try {
    isFile = fs.statSync(path).isFile();
  } catch {
    return {
      name: "apps/web/.dev.vars readable",
      status: "FAIL",
      message: `${path} is not readable (broken symlink?)`,
      remediation: "ensure the file or symlink target is present and readable",
    };
  }
  if (!isFile) {
    return {
      name: "apps/web/.dev.vars exists",
      status: "FAIL",
      message: `${path} is not a regular file`,
      remediation: "replace with a real file (or symlink to one)",
    };
  }
  return { name: "apps/web/.dev.vars exists", status: "OK", message: "present and readable" };
}

export function checkMigrations(deps: DoctorDeps = {}): CheckResult {
  const fs = deps.fs ?? defaultFs;
  const sqlite = deps.sqlite ?? defaultSqliteRunner;
  const repoRoot = deps.repoRoot ?? findRepoRoot(deps.cwd ?? process.cwd());
  const migrationsDir = join(repoRoot, "apps", "web", "migrations");

  let committed: string[];
  try {
    committed = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
  } catch {
    return {
      name: "D1 migrations match committed",
      status: "FAIL",
      message: `cannot read ${migrationsDir}`,
      remediation: "run from the repo root or check the migrations directory",
    };
  }

  const d1Root = join(repoRoot, "apps", "web", ".wrangler", "state", "v3", "d1");
  if (!fs.existsSync(d1Root)) {
    return {
      name: "D1 migrations match committed",
      status: "WARN",
      message: "no local Wrangler D1 state found (have you run the dev server yet?)",
      remediation: "pnpm --filter @agent-kanban/web db:migrate  (or: pnpm dev once)",
    };
  }

  // Find the SQLite DB file under any UUID/binding directory.
  let dbFile: string | null = null;
  const visit = (dir: string, depth: number) => {
    if (dbFile || depth > 4) return;
    let entries: string[] = [];
    try {
      entries = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      if (entry.endsWith(".sqlite")) {
        // Skip metadata.sqlite — we want the data DB.
        if (entry === "metadata.sqlite") continue;
        dbFile = full;
        return;
      }
      try {
        const st = fs.statSync(full) as any;
        if (st.isDirectory?.()) visit(full, depth + 1);
      } catch {
        // ignore
      }
    }
  };
  visit(d1Root, 0);

  if (!dbFile) {
    return {
      name: "D1 migrations match committed",
      status: "WARN",
      message: "Wrangler D1 directory present but no .sqlite database file found",
      remediation: "pnpm --filter @agent-kanban/web db:migrate",
    };
  }

  const applied = sqlite(dbFile, "SELECT name FROM d1_migrations ORDER BY name;");
  if (!applied.ok) {
    return {
      name: "D1 migrations match committed",
      status: "WARN",
      message: `could not query d1_migrations: ${applied.error}`,
      remediation: "install sqlite3 CLI, or run pnpm --filter @agent-kanban/web db:migrate",
    };
  }

  const appliedSet = new Set(applied.rows);
  const committedSet = new Set(committed);
  const missing = committed.filter((m) => !appliedSet.has(m));
  const extra = applied.rows.filter((m) => !committedSet.has(m));

  if (missing.length === 0 && extra.length === 0) {
    return {
      name: "D1 migrations match committed",
      status: "OK",
      message: `${committed.length} migrations applied`,
    };
  }
  const parts: string[] = [];
  if (missing.length > 0) parts.push(`missing: ${missing.join(", ")}`);
  if (extra.length > 0) parts.push(`unexpected: ${extra.join(", ")}`);
  return {
    name: "D1 migrations match committed",
    status: "FAIL",
    message: `drift detected — ${parts.join("; ")}`,
    remediation: "pnpm --filter @agent-kanban/web db:migrate  (or rebuild local state)",
  };
}

export function checkWorktreeSymlinks(deps: DoctorDeps = {}): CheckResult {
  const fs = deps.fs ?? defaultFs;
  const cwd = deps.cwd ?? process.cwd();
  const repoRoot = deps.repoRoot ?? findRepoRoot(cwd);
  // Detect: is repoRoot inside a `.worktrees/` directory?
  const inWorktree = isAbsolute(repoRoot) && repoRoot.split("/").includes(".worktrees");
  if (!inWorktree) {
    return {
      name: "Worktree symlinks healthy",
      status: "OK",
      message: "N/A — running from main repo",
    };
  }
  const expected = [
    "node_modules",
    join("apps", "web", "node_modules"),
    join("packages", "shared", "node_modules"),
    join("packages", "cli", "node_modules"),
  ];
  const broken: string[] = [];
  for (const rel of expected) {
    const full = join(repoRoot, rel);
    if (!fs.existsSync(full)) {
      broken.push(`${rel} (missing)`);
      continue;
    }
    try {
      fs.lstatSync(full).isSymbolicLink();
    } catch {
      broken.push(`${rel} (unreadable)`);
    }
    // Not a symlink is allowed (e.g., real install) — only missing/unreadable are flagged above.
  }
  if (broken.length > 0) {
    return {
      name: "Worktree symlinks healthy",
      status: "FAIL",
      message: `broken or missing: ${broken.join(", ")}`,
      remediation: "rerun bash scripts/worktree-add.sh (or recreate the symlinks manually)",
    };
  }
  return { name: "Worktree symlinks healthy", status: "OK", message: "all expected node_modules symlinks intact" };
}

export function runAllChecks(deps: DoctorDeps = {}): CheckResult[] {
  // Resolve repoRoot once for consistent reporting.
  const repoRoot = deps.repoRoot ?? findRepoRoot(deps.cwd ?? process.cwd());
  const sharedDeps: DoctorDeps = { ...deps, repoRoot };
  return [checkGpg(sharedDeps), checkDevVars(sharedDeps), checkMigrations(sharedDeps), checkWorktreeSymlinks(sharedDeps)];
}

export function formatResults(results: CheckResult[]): string {
  const lines: string[] = [];
  const labelWidth = Math.max(...results.map((r) => r.status.length));
  for (const r of results) {
    const tag = r.status.padEnd(labelWidth);
    lines.push(`[${tag}] ${r.name}`);
    lines.push(`        ${r.message}`);
    if (r.remediation && r.status !== "OK") {
      lines.push(`        → ${r.remediation}`);
    }
  }
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const warnCount = results.filter((r) => r.status === "WARN").length;
  lines.push("");
  if (failCount > 0) {
    lines.push(`${failCount} check(s) failed, ${warnCount} warning(s).`);
  } else if (warnCount > 0) {
    lines.push(`All required checks passed (${warnCount} warning(s)).`);
  } else {
    lines.push("All checks passed.");
  }
  return lines.join("\n");
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Verify local dev-environment prerequisites for Agent Kanban")
    .action(() => {
      const results = runAllChecks();
      console.log(formatResults(results));
      const hasFail = results.some((r) => r.status === "FAIL");
      process.exit(hasFail ? 1 : 0);
    });
}

// Exported for tests
export { findRepoRoot };
