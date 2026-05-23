import type { TeamMember } from "@agent-kanban/shared";
import { BUILTIN_TEAM_MEMBERS } from "@agent-kanban/shared";
import { type D1, newLongId, parseJsonFields } from "./db";

const parseTeamMember = <T extends TeamMember>(row: T) => parseJsonFields(row, ["capabilities", "handoff_to", "skills"]);

const TEAM_MEMBER_COLUMNS =
  "id, owner_id, name, username, display_name, description, bio, soul, role, capabilities, handoff_to, skills, md_path, avatar_path, builtin, version, created_at, updated_at";

/**
 * Returns true when (owner_id, username) already exists in either the
 * agents or team_members tables. Phase 1 uniqueness is enforced
 * application-side because SQLite cannot express cross-table UNIQUE.
 * Per spec §2 (decision #1).
 */
export async function usernameExistsForOwner(db: D1, ownerId: string, username: string): Promise<"agents" | "team_members" | null> {
  const inAgents = await db
    .prepare("SELECT 1 FROM agents WHERE owner_id = ? AND username = ? LIMIT 1")
    .bind(ownerId, username)
    .first<{ 1: number }>();
  if (inAgents) return "agents";
  const inTeam = await db
    .prepare("SELECT 1 FROM team_members WHERE owner_id = ? AND username = ? LIMIT 1")
    .bind(ownerId, username)
    .first<{ 1: number }>();
  if (inTeam) return "team_members";
  return null;
}

export async function listTeamMembers(db: D1, ownerId: string): Promise<TeamMember[]> {
  const result = await db
    .prepare(`SELECT ${TEAM_MEMBER_COLUMNS} FROM team_members WHERE owner_id = ? AND version = 'latest' ORDER BY created_at ASC`)
    .bind(ownerId)
    .all<TeamMember>();
  return result.results.map(parseTeamMember);
}

export async function getTeamMemberByUsername(db: D1, ownerId: string, username: string): Promise<TeamMember | null> {
  const row = await db
    .prepare(`SELECT ${TEAM_MEMBER_COLUMNS} FROM team_members WHERE owner_id = ? AND username = ? AND version = 'latest'`)
    .bind(ownerId, username)
    .first<TeamMember>();
  return row ? parseTeamMember(row) : null;
}

interface CreateTeamMemberInput {
  name: string;
  username: string;
  display_name?: string | null;
  description?: string | null;
  bio?: string | null;
  soul?: string | null;
  role?: string | null;
  capabilities?: string[] | null;
  handoff_to?: string[] | null;
  skills?: string[] | null;
  md_path?: string | null;
  avatar_path?: string | null;
  builtin?: boolean;
}

export class TeamMemberUsernameConflictError extends Error {
  constructor(
    public readonly username: string,
    public readonly source: "agents" | "team_members",
  ) {
    super(`Username "${username}" is already taken by an existing ${source === "agents" ? "agent" : "team member"}`);
    this.name = "TeamMemberUsernameConflictError";
  }
}

export async function createTeamMember(db: D1, ownerId: string, input: CreateTeamMemberInput): Promise<TeamMember> {
  const conflict = await usernameExistsForOwner(db, ownerId, input.username);
  if (conflict) throw new TeamMemberUsernameConflictError(input.username, conflict);

  const id = newLongId();
  const now = new Date().toISOString();
  const member: TeamMember = {
    id,
    owner_id: ownerId,
    name: input.name,
    username: input.username,
    display_name: input.display_name ?? null,
    description: input.description ?? null,
    bio: input.bio ?? null,
    soul: input.soul ?? null,
    role: input.role ?? null,
    capabilities: input.capabilities ?? null,
    handoff_to: input.handoff_to ?? null,
    skills: input.skills ?? null,
    md_path: input.md_path ?? null,
    avatar_path: input.avatar_path ?? null,
    builtin: input.builtin ? 1 : 0,
    version: "latest",
    created_at: now,
    updated_at: now,
  };
  await db
    .prepare(`
      INSERT INTO team_members (${TEAM_MEMBER_COLUMNS})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      member.id,
      member.owner_id,
      member.name,
      member.username,
      member.display_name,
      member.description,
      member.bio,
      member.soul,
      member.role,
      member.capabilities ? JSON.stringify(member.capabilities) : null,
      member.handoff_to ? JSON.stringify(member.handoff_to) : null,
      member.skills ? JSON.stringify(member.skills) : null,
      member.md_path,
      member.avatar_path,
      member.builtin,
      member.version,
      member.created_at,
      member.updated_at,
    )
    .run();
  return member;
}

export async function updateTeamMemberAvatarPath(db: D1, ownerId: string, username: string, avatarPath: string): Promise<TeamMember | null> {
  const now = new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE team_members SET avatar_path = ?, updated_at = ? WHERE owner_id = ? AND username = ? AND version = 'latest' RETURNING ${TEAM_MEMBER_COLUMNS}`,
    )
    .bind(avatarPath, now, ownerId, username)
    .first<TeamMember>();
  return result ? parseTeamMember(result) : null;
}

/**
 * Idempotent. Per-owner. Skips any builtin role that already has a row
 * for this owner, so re-running on existing workspaces is safe.
 */
export async function seedBuiltinTeamMembers(db: D1, ownerId: string): Promise<void> {
  const existing = await db.prepare("SELECT username FROM team_members WHERE owner_id = ? AND builtin = 1").bind(ownerId).all<{ username: string }>();
  const existingUsernames = new Set(existing.results.map((r) => r.username));

  for (const tpl of BUILTIN_TEAM_MEMBERS) {
    if (existingUsernames.has(tpl.username)) continue;
    // Defensive: if the username is taken by an agent for this owner, skip
    // rather than throw. seedBuiltinTeamMembers is invoked in the new-owner
    // bootstrap path; collisions there indicate a misconfiguration but
    // shouldn't break board creation.
    const conflict = await usernameExistsForOwner(db, ownerId, tpl.username);
    if (conflict === "agents") continue;
    await createTeamMember(db, ownerId, {
      name: tpl.name,
      username: tpl.username,
      display_name: tpl.display_name,
      description: tpl.description,
      bio: tpl.bio,
      soul: tpl.soul,
      role: tpl.role,
      capabilities: tpl.capabilities,
      handoff_to: tpl.handoff_to ?? null,
      skills: tpl.skills ?? null,
      md_path: tpl.md_path,
      builtin: true,
    });
  }
}
