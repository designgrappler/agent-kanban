import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { TeamCard } from "../components/TeamCard";
import { useTeamMembers } from "../hooks/useTeamMembers";

export function AgentsPage() {
  const { teamMembers, loading: teamLoading } = useTeamMembers();

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-content-primary">Team members</h1>
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-content-tertiary">
              <span>{teamMembers.length} team</span>
            </div>
          </div>
        </div>

        <section aria-labelledby="team-section-heading" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="team-section-heading" className="font-mono text-xs uppercase tracking-[0.18em] text-content-tertiary">
              Team <span className="ml-1 text-content-tertiary/70">{teamMembers.length}</span>
            </h2>
          </div>
          {teamLoading ? (
            <TeamGridSkeleton />
          ) : teamMembers.length === 0 ? (
            <EmptyState label="No team members yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {teamMembers.map((member) => (
                <TeamCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TeamGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-32 animate-pulse rounded-lg border border-border bg-surface-secondary" />
      ))}
    </div>
  );
}

function EmptyState({ label, action, href }: { label: string; action?: string; href?: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-content-tertiary">{label}</p>
      {action && href && (
        <Link to={href} className="mt-2 inline-block text-sm text-accent hover:underline">
          {action}
        </Link>
      )}
    </div>
  );
}
