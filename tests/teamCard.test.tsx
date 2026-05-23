// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { TeamCard } from "../apps/web/src/components/TeamCard.js";

function makeTeamMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "tm-1",
    owner_id: "owner-1",
    name: "Peaches",
    username: "peaches",
    display_name: "Peaches",
    description: null,
    bio: "Lean, decisive, ruthlessly scoped.",
    soul: null,
    role: "architect",
    capabilities: ["planning", "bridging"],
    handoff_to: ["skylar"],
    skills: null,
    md_path: ".claude/agents/peaches.md",
    builtin: 1,
    version: "latest",
    created_at: "2026-05-22T00:00:00.000Z",
    updated_at: "2026-05-22T00:00:00.000Z",
    ...overrides,
  };
}

function renderCard(member = makeTeamMember()) {
  return render(React.createElement(MemoryRouter, null, React.createElement(TeamCard, { member })));
}

describe("TeamCard", () => {
  it("renders display_name as the heading", () => {
    renderCard();
    expect(screen.getByRole("heading", { name: "Peaches" })).toBeTruthy();
  });

  it("renders @handle", () => {
    renderCard();
    expect(screen.getByText("@peaches")).toBeTruthy();
  });

  it("renders the role badge", () => {
    renderCard();
    expect(screen.getByText("architect")).toBeTruthy();
  });

  it("renders the role-glyph icon for architect", () => {
    const { container } = renderCard();
    // The role icon title is set to 'Architect'
    const glyph = container.querySelector("[title='Architect']");
    expect(glyph).not.toBeNull();
  });

  it("renders the built-in badge when builtin is truthy", () => {
    renderCard(makeTeamMember({ builtin: 1 }));
    expect(screen.getByText("built-in")).toBeTruthy();
  });

  it("does not render the built-in badge for non-builtin members", () => {
    renderCard(makeTeamMember({ builtin: 0 }));
    expect(screen.queryByText("built-in")).toBeNull();
  });

  it("renders initials avatar with correct initials", () => {
    const { container } = renderCard(makeTeamMember({ display_name: "Lead Peaches", name: "Lead Peaches" }));
    // The initials span is aria-hidden and contains the two-letter initials
    const initialsEl = container.querySelector("[aria-hidden]");
    expect(initialsEl?.textContent).toBe("LP");
  });

  it("falls back to name when display_name is null", () => {
    renderCard(makeTeamMember({ display_name: null, name: "Peaches" }));
    expect(screen.getByRole("heading", { name: "Peaches" })).toBeTruthy();
  });

  it("does NOT render an AgentIdenticon", () => {
    const { container } = renderCard();
    // AgentIdenticon renders an <svg> or a canvas — assert no crypto-identicon element is present.
    // The component uses an initials <span>, never AgentIdenticon.
    const _svgElements = container.querySelectorAll("svg");
    // Only lucide icons (role glyph) are SVGs — none are AgentIdenticon which would be a standalone svg with style based on publicKey
    // We verify no element with data-identicon or id matching the AgentIdenticon pattern exists
    expect(container.querySelector("[data-identicon]")).toBeNull();
    // The initials avatar must be a span, not an svg or canvas
    const initialsEl = container.querySelector("[aria-hidden]");
    expect(initialsEl?.tagName.toLowerCase()).toBe("span");
  });

  it("does NOT render model or runtime information", () => {
    renderCard();
    // Model field must not appear
    expect(screen.queryByText(/claude|gpt|gemini|codex|hermes/i)).toBeNull();
    // Runtime labels must not appear
    expect(screen.queryByText(/Claude|GPT|Gemini|Copilot|Hermes/)).toBeNull();
  });

  it("does NOT render task counts, token counts, or cost metrics", () => {
    renderCard();
    expect(screen.queryByText(/active/i)).toBeNull();
    expect(screen.queryByText(/queued/i)).toBeNull();
    expect(screen.queryByText(/tok/i)).toBeNull();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it("does NOT render a fingerprint chip or crypto ID", () => {
    renderCard();
    // The team pill ("team") is removed; fingerprint chips are gone
    expect(screen.queryByText("team")).toBeNull();
    // No crypto fingerprint text pattern
    expect(screen.queryByText(/[0-9a-f]{4}:[0-9a-f]{4}/i)).toBeNull();
  });

  it("does NOT render the description/bio paragraph", () => {
    const member = makeTeamMember({ description: "A visible description." });
    renderCard(member);
    // description is stripped from the card render
    expect(screen.queryByText("A visible description.")).toBeNull();
  });

  it("does NOT render handoff_to or capability counts", () => {
    renderCard(makeTeamMember({ handoff_to: ["skylar"], capabilities: ["planning"] }));
    expect(screen.queryByText(/→ skylar/i)).toBeNull();
    expect(screen.queryByText(/caps/i)).toBeNull();
  });

  it("links to /team/:username", () => {
    const { container } = renderCard();
    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/team/peaches");
  });
});
