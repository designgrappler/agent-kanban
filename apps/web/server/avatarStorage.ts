/// <reference types="node" />

/**
 * Avatar storage — writes uploaded avatar files to .claude/agents/avatars/
 *
 * Uses node:fs (available via nodejs_compat flag in wrangler.toml).
 * In production Cloudflare Workers, this module will not be invoked because
 * the avatar upload endpoint is a local-dev-only affordance (Tim's locked
 * decision: local file path, served by the Vite dev server).
 *
 * Security hardening:
 * - Username sanitized against ^[a-z0-9_-]+$ (path traversal prevention)
 * - MIME type allowlist: image/png, image/jpeg, image/jpg, image/webp
 * - Size limit: 1 MB
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const USERNAME_RE = /^[a-z0-9_-]+$/;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_BYTES = 1 * 1024 * 1024; // 1 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
};

export class AvatarValidationError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 413,
  ) {
    super(message);
    this.name = "AvatarValidationError";
  }
}

/**
 * Validates username, MIME type, and file size. Returns the sanitized
 * extension for the chosen mime type.
 */
export function validateAvatarUpload(username: string, mimeType: string, byteLength: number): string {
  if (!USERNAME_RE.test(username)) {
    throw new AvatarValidationError(`Invalid username "${username}". Only lowercase letters, digits, underscores and hyphens allowed.`, 400);
  }
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AvatarValidationError(`Unsupported MIME type "${mimeType}". Allowed: image/png, image/jpeg, image/webp.`, 400);
  }
  if (byteLength > MAX_BYTES) {
    throw new AvatarValidationError(`File too large (${byteLength} bytes). Maximum is 1 MB.`, 413);
  }
  return MIME_TO_EXT[mimeType] ?? "png";
}

/**
 * Writes avatar bytes to disk under .claude/agents/avatars/{username}.{ext}
 * relative to the project root (cwd at worker startup in dev mode).
 *
 * Returns the relative path stored in the DB.
 */
export async function writeAvatarFile(username: string, ext: string, bytes: Uint8Array): Promise<string> {
  const avatarsDir = join(process.cwd(), ".claude", "agents", "avatars");
  await mkdir(avatarsDir, { recursive: true });

  const filename = `${username}.${ext}`;
  const filePath = join(avatarsDir, filename);
  await writeFile(filePath, bytes);

  return `.claude/agents/avatars/${filename}`;
}
