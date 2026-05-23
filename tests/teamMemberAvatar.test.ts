// @vitest-environment node
//
// Unit tests for avatarStorage.ts — validation rules only.
// File-system write is NOT tested here (no disk I/O in unit tests).

import { describe, expect, it } from "vitest";

describe("validateAvatarUpload — username regex", () => {
  it("accepts valid lowercase-alphanumeric usernames", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    expect(() => validateAvatarUpload("peaches", "image/png", 100)).not.toThrow();
    expect(() => validateAvatarUpload("sky-lar", "image/png", 100)).not.toThrow();
    expect(() => validateAvatarUpload("agent_1", "image/png", 100)).not.toThrow();
  });

  it("rejects path traversal attempts", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    expect(() => validateAvatarUpload("../../etc/passwd", "image/png", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("../bad", "image/png", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("UpperCase", "image/png", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("has space", "image/png", 100)).toThrow(AvatarValidationError);
  });

  it("rejects path traversal with 400 status", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    try {
      validateAvatarUpload("../../etc/passwd", "image/png", 100);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AvatarValidationError);
      expect((err as any).status).toBe(400);
    }
  });
});

describe("validateAvatarUpload — MIME type allowlist", () => {
  it("accepts allowed MIME types", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    expect(() => validateAvatarUpload("user", "image/png", 100)).not.toThrow();
    expect(() => validateAvatarUpload("user", "image/jpeg", 100)).not.toThrow();
    expect(() => validateAvatarUpload("user", "image/jpg", 100)).not.toThrow();
    expect(() => validateAvatarUpload("user", "image/webp", 100)).not.toThrow();
  });

  it("rejects disallowed MIME types", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    expect(() => validateAvatarUpload("user", "text/plain", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("user", "image/gif", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("user", "application/octet-stream", 100)).toThrow(AvatarValidationError);
    expect(() => validateAvatarUpload("user", "image/svg+xml", 100)).toThrow(AvatarValidationError);
  });

  it("rejects disallowed MIME types with 400 status", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    try {
      validateAvatarUpload("user", "image/gif", 100);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AvatarValidationError);
      expect((err as any).status).toBe(400);
    }
  });
});

describe("validateAvatarUpload — size limit", () => {
  it("accepts files at or below 1 MB", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    const oneMB = 1 * 1024 * 1024;
    expect(() => validateAvatarUpload("user", "image/png", oneMB)).not.toThrow();
    expect(() => validateAvatarUpload("user", "image/png", 200_000)).not.toThrow();
  });

  it("rejects files above 1 MB", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    const overLimit = 1 * 1024 * 1024 + 1;
    expect(() => validateAvatarUpload("user", "image/png", overLimit)).toThrow(AvatarValidationError);
  });

  it("rejects over-limit files with 413 status", async () => {
    const { validateAvatarUpload, AvatarValidationError } = await import("../apps/web/server/avatarStorage");
    try {
      validateAvatarUpload("user", "image/png", 2 * 1024 * 1024);
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AvatarValidationError);
      expect((err as any).status).toBe(413);
    }
  });
});

describe("validateAvatarUpload — extension mapping", () => {
  it("maps image/png to png extension", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    expect(validateAvatarUpload("user", "image/png", 100)).toBe("png");
  });

  it("maps image/jpeg to jpg extension", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    expect(validateAvatarUpload("user", "image/jpeg", 100)).toBe("jpg");
  });

  it("maps image/webp to webp extension", async () => {
    const { validateAvatarUpload } = await import("../apps/web/server/avatarStorage");
    expect(validateAvatarUpload("user", "image/webp", 100)).toBe("webp");
  });
});
