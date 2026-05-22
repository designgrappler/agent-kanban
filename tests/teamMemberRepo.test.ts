// @vitest-environment node

import { BUILTIN_TEAM_MEMBERS } from "@agent-kanban/shared";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestAgent, seedUser, setupMiniflare } from "./helpers/db";

let mf: Miniflare;
let db: D1Database;

beforeAll(async () => {
  ({ mf, db } = await setupMiniflare());
});

afterAll(async () => {
  await mf.dispose();
});

describe("teamMemberRepo", () => {
  it("seedBuiltinTeamMembers seeds peaches/skylar/bandit for an owner", async () => {
    const ownerId = "tm-owner-1";
    await seedUser(db, ownerId, "tm1@test.com");

    const { seedBuiltinTeamMembers, listTeamMembers } = await import("../apps/web/server/teamMemberRepo");
    await seedBuiltinTeamMembers(db, ownerId);

    const members = await listTeamMembers(db, ownerId);
    expect(members).toHaveLength(BUILTIN_TEAM_MEMBERS.length);
    expect(members.map((m) => m.username).sort()).toEqual(["bandit", "peaches", "skylar"]);

    const peaches = members.find((m) => m.username === "peaches");
    expect(peaches).toBeDefined();
    expect(peaches!.role).toBe("architect");
    expect(peaches!.builtin).toBe(1);
    expect(peaches!.md_path).toBe(".claude/agents/peaches.md");
    expect(Array.isArray(peaches!.capabilities)).toBe(true);
    expect(peaches!.capabilities!.length).toBeGreaterThan(0);
    expect(peaches!.soul).toBeTruthy();
    expect(peaches!.soul!.length).toBeGreaterThan(0);

    const bandit = members.find((m) => m.username === "bandit");
    expect(bandit!.role).toBe("reviewer");
    const skylar = members.find((m) => m.username === "skylar");
    expect(skylar!.role).toBe("specialist");
  });

  it("seedBuiltinTeamMembers is idempotent (re-running produces same rows)", async () => {
    const ownerId = "tm-owner-2";
    await seedUser(db, ownerId, "tm2@test.com");

    const { seedBuiltinTeamMembers, listTeamMembers } = await import("../apps/web/server/teamMemberRepo");
    await seedBuiltinTeamMembers(db, ownerId);
    const first = await listTeamMembers(db, ownerId);

    await seedBuiltinTeamMembers(db, ownerId);
    const second = await listTeamMembers(db, ownerId);

    expect(second).toHaveLength(first.length);
    expect(second.map((m) => m.id).sort()).toEqual(first.map((m) => m.id).sort());
  });

  it("listTeamMembers returns owner-scoped rows only", async () => {
    const ownerA = "tm-scope-a";
    const ownerB = "tm-scope-b";
    await seedUser(db, ownerA, "scope-a@test.com");
    await seedUser(db, ownerB, "scope-b@test.com");

    const { seedBuiltinTeamMembers, listTeamMembers } = await import("../apps/web/server/teamMemberRepo");
    await seedBuiltinTeamMembers(db, ownerA);

    const aMembers = await listTeamMembers(db, ownerA);
    const bMembers = await listTeamMembers(db, ownerB);

    expect(aMembers).toHaveLength(BUILTIN_TEAM_MEMBERS.length);
    expect(bMembers).toHaveLength(0);
  });

  it("createTeamMember rejects username already taken by an agent (cross-table uniqueness)", async () => {
    const ownerId = "tm-conflict-owner";
    await seedUser(db, ownerId, "conflict@test.com");

    // First create a crypto agent with a given username
    await createTestAgent(db, ownerId, { name: "Crypto Owl", username: "owl-shared", runtime: "claude" });

    const { createTeamMember, TeamMemberUsernameConflictError } = await import("../apps/web/server/teamMemberRepo");

    await expect(createTeamMember(db, ownerId, { name: "Owl TM", username: "owl-shared" })).rejects.toBeInstanceOf(TeamMemberUsernameConflictError);
  });

  it("createTeamMember rejects duplicate within team_members for the same owner", async () => {
    const ownerId = "tm-dup-owner";
    await seedUser(db, ownerId, "dup@test.com");

    const { createTeamMember, TeamMemberUsernameConflictError } = await import("../apps/web/server/teamMemberRepo");
    await createTeamMember(db, ownerId, { name: "Dup", username: "dup-tm" });
    await expect(createTeamMember(db, ownerId, { name: "Dup 2", username: "dup-tm" })).rejects.toBeInstanceOf(TeamMemberUsernameConflictError);
  });

  it("createBoard wires seedBuiltinTeamMembers into the new-owner bootstrap", async () => {
    const ownerId = "tm-bootstrap-owner";
    await seedUser(db, ownerId, "bootstrap@test.com");

    const { createBoard } = await import("../apps/web/server/boardRepo");
    await createBoard(db, ownerId, "Bootstrap Board", "dev");

    const { listTeamMembers } = await import("../apps/web/server/teamMemberRepo");
    const members = await listTeamMembers(db, ownerId);
    expect(members).toHaveLength(BUILTIN_TEAM_MEMBERS.length);
  });
});
