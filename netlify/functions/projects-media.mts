import type { Config, Context } from "@netlify/functions";
import { FILE_ID_RE, type FileMeta, projectsStore } from "../lib/projects-store.mts";

/**
 * Serves uploaded gallery media from Netlify Blobs at /media/<fileId>.
 * Supports HTTP Range requests (required for video playback in Safari/iOS).
 * A single response never spans more than one stored chunk, which keeps each
 * response well under the function response size limit; browsers simply
 * request the next range.
 */

const IMMUTABLE = "public, max-age=31536000, immutable";

export default async (req: Request, context: Context) => {
  const fileId = context.params?.id || new URL(req.url).pathname.split("/").pop() || "";
  if (!FILE_ID_RE.test(fileId)) return new Response("Not found", { status: 404 });

  const store = projectsStore(context);
  const meta = (await store.get(`f/${fileId}`, { type: "json" })) as FileMeta | null;
  if (!meta) return new Response("Not found", { status: 404 });

  const baseHeaders: Record<string, string> = {
    "Content-Type": meta.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": IMMUTABLE,
    ETag: `"${meta.id}"`,
  };

  if (req.headers.get("if-none-match") === `"${meta.id}"`) {
    return new Response(null, { status: 304, headers: baseHeaders });
  }

  const range = req.headers.get("range");
  let start = 0;
  let end = meta.size - 1;
  let partial = false;

  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) {
      return new Response(null, { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${meta.size}` } });
    }
    if (m[1] === "") {
      // suffix range: last N bytes
      const n = Number(m[2]);
      start = Math.max(0, meta.size - n);
    } else {
      start = Number(m[1]);
      if (m[2] !== "") end = Math.min(Number(m[2]), meta.size - 1);
    }
    if (start >= meta.size || start > end) {
      return new Response(null, { status: 416, headers: { ...baseHeaders, "Content-Range": `bytes */${meta.size}` } });
    }
    partial = true;
  }

  // Whole file requested and it spans several chunks: answer with the first
  // chunk as a 206 so the browser continues with range requests.
  if (!partial && meta.chunks > 1) partial = true;

  // Clamp the response to the chunk that contains `start`.
  const chunkIndex = Math.floor(start / meta.chunkSize);
  const chunkStart = chunkIndex * meta.chunkSize;
  const chunkEnd = Math.min(chunkStart + meta.chunkSize, meta.size) - 1;
  end = Math.min(end, chunkEnd);

  const chunk = (await store.get(`c/${fileId}/${chunkIndex}`, { type: "arrayBuffer" })) as ArrayBuffer | null;
  if (!chunk) return new Response("Missing data", { status: 500 });
  const body = chunk.slice(start - chunkStart, end - chunkStart + 1);

  if (!partial) {
    return new Response(body, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(body.byteLength), "Netlify-CDN-Cache-Control": IMMUTABLE },
    });
  }
  return new Response(body, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Length": String(body.byteLength),
      "Content-Range": `bytes ${start}-${end}/${meta.size}`,
    },
  });
};

export const config: Config = {
  path: "/media/:id",
};
