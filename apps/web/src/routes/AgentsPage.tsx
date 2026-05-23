import { useState } from "react";
import { AddTeamMemberDialog } from "../components/AddTeamMemberDialog";
import { DefaultAgentsPicker } from "../components/DefaultAgentsPicker";
import { Header } from "../components/Header";
import { TeamCard } from "../components/TeamCard";
import { TeamMembersEmptyState } from "../components/TeamMembersEmptyState";
import { Button } from "../components/ui/button";
import { useBoards } from "../hooks/useBoard";
import { useTeamMembers } from "../hooks/useTeamMembers";

export function AgentsPage() {
  const { teamMembers, loading: teamLoading } = useTeamMembers();
  const { boards, loading: boardsLoading } = useBoards();
  const [defaultPickerOpen, setDefaultPickerOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  // Zero-state: no team members AND no boards
  const isZeroState = !teamLoading && !boardsLoading && teamMembers.length === 0 && boards.length === 0;

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8 sm:py-10">
        {isZeroState ? (
          <TeamMembersEmptyState onAddTeamMember={() => setDefaultPickerOpen(true)} />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-content-primary">Team members</h1>
                <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-content-tertiary">
                  <span>{teamMembers.length} team</span>
                </div>
              </div>

              {/* Header CTAs — only shown once there are members or boards */}
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDefaultPickerOpen(true)}>
                  Recruit an agent
                </Button>
                <Button size="sm" onClick={() => setAddMemberOpen(true)}>
                  Add team member
                </Button>
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
                <EmptyTeamHint onRecruit={() => setDefaultPickerOpen(true)} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {teamMembers.map((member) => (
                    <TeamCard key={member.id} member={member} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <DefaultAgentsPicker open={defaultPickerOpen} onClose={() => setDefaultPickerOpen(false)} />
      <AddTeamMemberDialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} />
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

function EmptyTeamHint({ onRecruit }: { onRecruit: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm text-content-tertiary">No team members yet.</p>
      <button type="button" onClick={onRecruit} className="mt-2 text-sm text-accent underline-offset-2 hover:underline">
        Recruit an agent
      </button>
    </div>
  );
}
