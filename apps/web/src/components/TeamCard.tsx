import type { TeamMember } from "@agent-kanban/shared";
import { Compass, type LucideIcon, Shield, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const ROLE_GLYPHS: Record<string, { icon: LucideIcon; label: string }> = {
  architect: { icon: Compass, label: "Architect" },
  specialist: { icon: Wrench, label: "Specialist" },
  reviewer: { icon: Shield, label: "Reviewer" },
};

function initialsFor(member: TeamMember): string {
  const source = member.display_name?.trim() || member.name?.trim() || member.username;
  const parts = source.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function TeamCard({ member }: { member: TeamMember }) {
  const role = member.role ?? "";
  const glyph = ROLE_GLYPHS[role];
  const RoleIcon = glyph?.icon;
  const initials = initialsFor(member);
  const displayName = member.display_name?.trim() || member.name;

  return (
    <Link
      to={`/team/${member.username}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-surface-secondary transition-all hover:-translate-y-px hover:border-accent/35"
    >
      {/* Muted accent stripe — signals "no key" vs the colored stripe on AgentCard */}
      <div className="h-[3px] bg-accent/30" />

      <div className="flex flex-col items-center px-5 pb-5 pt-7 text-center">
        <div className="relative">
          <span
            aria-hidden
            className="flex size-[60px] shrink-0 items-center justify-center rounded-lg border border-border bg-surface-primary font-mono text-lg font-semibold text-content-primary"
          >
            {initials}
          </span>
          {RoleIcon && (
            <span
              title={glyph.label}
              className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-surface-primary text-content-secondary"
            >
              <RoleIcon className="size-3" />
            </span>
          )}
        </div>

        <div className="mt-3 flex max-w-full items-center gap-1.5">
          <h2 className="truncate font-mono text-base font-bold text-content-primary">{displayName}</h2>
          {member.builtin ? (
            <span className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[9px] text-content-tertiary">built-in</span>
          ) : null}
        </div>

        <span className="mt-0.5 max-w-full truncate font-mono text-[10px] text-content-tertiary">@{member.username}</span>

        {role && (
          <div className="mt-2 flex max-w-full flex-wrap justify-center gap-1.5">
            <span className="max-w-full truncate rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-content-tertiary">{role}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
