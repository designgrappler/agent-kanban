import { useRef, useState } from "react";
import { useCreateTeamMember, useUploadAvatar } from "../hooks/useTeamMembers";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface AddTeamMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormFields {
  display_name: string;
  role: string;
  bio: string;
  soul: string;
  capabilities: string;
  handoff_to: string;
  skills: string;
}

const EMPTY_FORM: FormFields = {
  display_name: "",
  role: "",
  bio: "",
  soul: "",
  capabilities: "",
  handoff_to: "",
  skills: "",
};

function splitCommaList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function AddTeamMemberDialog({ open, onClose }: AddTeamMemberDialogProps) {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createTeamMember = useCreateTeamMember();
  const uploadAvatar = useUploadAvatar();

  function handleClose() {
    setForm(EMPTY_FORM);
    setAvatarFile(null);
    setAvatarPreview(null);
    setError(null);
    onClose();
  }

  function handleFieldChange(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size guard — server also enforces this
    if (file.size > 1 * 1024 * 1024) {
      setError("Avatar must be 1 MB or smaller.");
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const displayName = form.display_name.trim();
    if (!displayName) {
      setError("Display name is required.");
      return;
    }

    try {
      const member = await createTeamMember.mutateAsync({
        display_name: displayName,
        role: form.role.trim() || undefined,
        bio: form.bio.trim() || undefined,
        soul: form.soul.trim() || undefined,
        capabilities: form.capabilities.trim() ? splitCommaList(form.capabilities) : undefined,
        handoff_to: form.handoff_to.trim() ? splitCommaList(form.handoff_to) : undefined,
        skills: form.skills.trim() ? splitCommaList(form.skills) : undefined,
      });

      if (avatarFile && member.username) {
        try {
          await uploadAvatar.mutateAsync({ username: member.username, file: avatarFile });
        } catch (avatarErr) {
          // Avatar upload failure is non-fatal — member was created successfully
          setError(`Team member created, but avatar upload failed: ${avatarErr instanceof Error ? avatarErr.message : "Unknown error"}`);
          return;
        }
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team member");
    }
  }

  const isPending = createTeamMember.isPending || uploadAvatar.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>Create a new team member with Agent OS template fields.</DialogDescription>
        </DialogHeader>

        <form id="add-team-member-form" onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Avatar upload */}
          <div className="flex items-center gap-4">
            <div
              className="flex size-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-secondary text-content-tertiary transition-colors hover:border-border/80 hover:bg-surface-tertiary"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload avatar image"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="size-full object-cover" />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-content-secondary">Avatar (optional)</p>
              <p className="text-xs text-content-tertiary">PNG, JPEG, or WebP — max 1 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                aria-label="Choose avatar file"
              />
            </div>
          </div>

          {/* display_name — required */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-display-name">
              Display name{" "}
              <span aria-hidden className="text-error">
                *
              </span>
            </Label>
            <Input
              id="tm-display-name"
              value={form.display_name}
              onChange={(e) => handleFieldChange("display_name", e.target.value)}
              placeholder="e.g. peaches"
              required
            />
          </div>

          {/* role */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-role">Role</Label>
            <Input
              id="tm-role"
              value={form.role}
              onChange={(e) => handleFieldChange("role", e.target.value)}
              placeholder="e.g. architect, specialist, reviewer"
            />
          </div>

          {/* bio */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-bio">Bio</Label>
            <Textarea
              id="tm-bio"
              value={form.bio}
              onChange={(e) => handleFieldChange("bio", e.target.value)}
              placeholder="Short description of this team member's purpose"
              rows={2}
            />
          </div>

          {/* soul */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-soul">Soul (system prompt)</Label>
            <Textarea
              id="tm-soul"
              value={form.soul}
              onChange={(e) => handleFieldChange("soul", e.target.value)}
              placeholder="Full system prompt / identity definition"
              rows={4}
            />
          </div>

          {/* capabilities — comma-separated */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-capabilities">Capabilities</Label>
            <Input
              id="tm-capabilities"
              value={form.capabilities}
              onChange={(e) => handleFieldChange("capabilities", e.target.value)}
              placeholder="Read, Write, Edit, Bash (comma-separated)"
            />
          </div>

          {/* handoff_to — comma-separated */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-handoff-to">Handoff to</Label>
            <Input
              id="tm-handoff-to"
              value={form.handoff_to}
              onChange={(e) => handleFieldChange("handoff_to", e.target.value)}
              placeholder="bandit, skylar (comma-separated)"
            />
          </div>

          {/* skills — comma-separated */}
          <div className="space-y-1.5">
            <Label htmlFor="tm-skills">Skills</Label>
            <Input
              id="tm-skills"
              value={form.skills}
              onChange={(e) => handleFieldChange("skills", e.target.value)}
              placeholder="source/repo@skill-name (comma-separated)"
            />
          </div>
        </form>

        {error && (
          <p className="rounded-md border border-error/40 bg-error/5 px-3 py-2 text-xs text-error" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" form="add-team-member-form" disabled={isPending}>
            {isPending ? "Creating..." : "Create team member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
