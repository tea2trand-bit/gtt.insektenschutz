import { getStore, getDeployStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Shared helpers for the project gallery admin.
 *
 * Storage layout (Netlify Blobs, store "gtt-projects"):
 *   index            JSON array of ProjectItem (display order)
 *   f/<fileId>       JSON FileMeta (content type, size, chunk layout)
 *   c/<fileId>/<n>   raw bytes of chunk n of an uploaded file
 *
 * Files are uploaded in chunks because a single function request body is
 * limited to ~6 MB, while project videos are usually much larger.
 */

export const CHUNK_SIZE = 3 * 1024 * 1024; // 3 MiB (base64-encoded stays well under the 6 MB function payload limit)
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MiB
export const MAX_CHUNKS = Math.ceil(MAX_FILE_SIZE / CHUNK_SIZE);

export interface FileMeta {
  id: string;
  contentType: string;
  size: number;
  chunkSize: number;
  chunks: number;
  createdAt: string;
}

export interface ProjectItem {
  id: string;
  type: "image" | "video";
  title: string;
  subtitle: string;
  file: string; // fileId of the main media
  poster?: string; // fileId of the poster image (videos)
  visible: boolean;
  createdAt: string;
}

export function projectsStore() {
  // Production data lives in the global store; previews/branch deploys get an
  // isolated deploy-scoped store so tests never touch the live gallery.
  const ctx = (globalThis as any).Netlify?.context?.deploy?.context;
  if (ctx === "production" || ctx === "dev") {
    return getStore({ name: "gtt-projects", consistency: "strong" });
  }
  return getDeployStore({ name: "gtt-projects" });
}

export async function readIndex(store: ReturnType<typeof projectsStore>): Promise<ProjectItem[]> {
  const list = await store.get("index", { type: "json" });
  return Array.isArray(list) ? (list as ProjectItem[]) : [];
}

export async function writeIndex(store: ReturnType<typeof projectsStore>, items: ProjectItem[]) {
  await store.setJSON("index", items);
}

export const FILE_ID_RE = /^[a-z0-9]{16,40}$/;

export function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

export function mediaUrl(fileId: string) {
  return `/media/${fileId}`;
}

/* ------------------------------------------------------------------ auth -- */

function secret(): string | null {
  const env = (globalThis as any).Netlify?.env;
  const pw = env?.get("ADMIN_PASSWORD") || process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const extra = env?.get("ADMIN_TOKEN_SECRET") || process.env.ADMIN_TOKEN_SECRET || "";
  return `gtt-admin:${pw}:${extra}`;
}

export function adminConfigured() {
  return secret() !== null;
}

export function checkPassword(candidate: unknown): boolean {
  const env = (globalThis as any).Netlify?.env;
  const pw = env?.get("ADMIN_PASSWORD") || process.env.ADMIN_PASSWORD;
  if (!pw || typeof candidate !== "string") return false;
  const a = createHmac("sha256", "cmp").update(candidate).digest();
  const b = createHmac("sha256", "cmp").update(pw).digest();
  return timingSafeEqual(a, b);
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h

export function issueToken(): string {
  const s = secret()!;
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `v1.${exp}`;
  const sig = createHmac("sha256", s).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyRequest(req: Request): boolean {
  const s = secret();
  if (!s) return false;
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", s).update(`v1.${parts[1]}`).digest("base64url");
  const a = Buffer.from(parts[2]);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
