import { Compass, FileText, type LucideIcon, Shield, Wrench } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Header } from "../components/Header";
import { useTeamMember } from "../hooks/useTeamMembers";

const ROLE_GLYPHS: Record<string, { icon: LucideIcon; label: string }> = {
  architect: { icon: Compass, label: "Architect" },
  specialist: { icon: Wrench, label: "Specialist" },
  reviewer: { icon: Shield, label: "Reviewer" },
};

function initialsFor(displayName: string | null, name: string, username: string): string {
  const source = displayName?.trim() || name?.trim() || username;
  const parts = source.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function TeamMemberDetailPage() {
  const { username } = useParams<{ username: string }>();
  const { teamMember, loading } = useTeamMember(username);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="h-32 animate-pulse rounded-lg border border-border bg-surface-secondary" />
        </div>
      </div>
    );
  }

  if (!teamMember) {
    return (
      <div className="min-h-screen bg-surface-primary">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <p className="text-sm text-content-tertiary">Team member not found.</p>
          <Link to="/agents" className="mt-3 inline-block text-sm text-accent hover:underline">
            Back to Agents
          </Link>
        </div>
      </div>
    );
  }

  const role = teamMember.role ?? "";
  const glyph = ROLE_GLYPHS[role];
  const RoleIcon = glyph?.icon;
  const initials = initialsFor(teamMember.display_name, teamMember.name, teamMember.username);
  const handoffTargets = teamMember.handoff_to ?? [];
  const capabilities = teamMember.capabilities ?? [];

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="mx-auto max-w-4xl px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-6">
          <Link to="/agents" className="font-mono text-xs text-content-tertiary hover:text-content-primary">
            ← Agents
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-surface-secondary">
          <div className="h-[3px] bg-accent/30" />
          <div className="flex flex-col items-start gap-5 px-6 py-6 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <span
                aria-hidden
                className="flex size-[72px] items-center justify-center rounded-lg border border-border bg-surface-primary font-mono text-xl font-semibold text-content-primary"
              >
                {initials}
              </span>
              {RoleIcon && (
                <span
                  title={glyph.label}
                  className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border border-border bg-surface-primary text-content-secondary"
                >
                  <RoleIcon className="size-3.5" />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-mono text-2xl font-bold text-content-primary">{teamMember.name}</h1>
                {teamMember.builtin ? (
                  <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary">built-in</span>
                ) : null}
                <span className="rounded-full border border-accent/40 bg-surface-primary/60 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-content-tertiary">
                  team
                </span>
              </div>
              <div className="mt-1 font-mono text-xs text-content-tertiary">@{teamMember.username}</div>
              {role && <div className="mt-2 font-mono text-xs text-content-secondary">{glyph?.label ?? role}</div>}
              {teamMember.description && <p className="mt-3 text-sm leading-6 text-content-secondary">{teamMember.description}</p>}
            </div>
          </div>

          <dl className="grid gap-4 border-t border-border/60 px-6 py-5 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-content-tertiary">Hands off to</dt>
              <dd className="mt-1 font-mono text-xs text-content-secondary">{handoffTargets.length > 0 ? handoffTargets.join(", ") : "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-content-tertiary">Capabilities</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {capabilities.length > 0 ? (
                  capabilities.map((cap) => (
                    <span key={cap} className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary">
                      {cap}
                    </span>
                  ))
                ) : (
                  <span className="font-mono text-xs text-content-secondary">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-content-tertiary">Source file</dt>
              <dd className="mt-1">
                {teamMember.md_path ? (
                  <a
                    href={`vscode://file/${teamMember.md_path}`}
                    className="inline-flex items-center gap-1 font-mono text-xs text-accent hover:underline"
                    title={`Open ${teamMember.md_path} on disk`}
                  >
                    <FileText className="size-3" />
                    {teamMember.md_path}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-content-secondary">—</span>
                )}
              </dd>
            </div>
          </dl>

          {teamMember.soul && (
            <section className="border-t border-border/60 px-6 py-5">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-content-tertiary">Soul</h2>
              <pre className="mt-3 max-h-[480px] overflow-auto rounded-md border border-border bg-surface-primary/60 p-4 font-mono text-xs leading-6 text-content-secondary whitespace-pre-wrap">
                {teamMember.soul}
              </pre>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
