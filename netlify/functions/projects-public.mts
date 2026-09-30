import type { Config } from "@netlify/functions";
import { json, mediaUrl, projectsStore, readIndex } from "../lib/projects-store.mts";

/** Public list of visible gallery items for the homepage. */
export default async () => {
  const store = projectsStore();
  const items = (await readIndex(store))
    .filter((i) => i.visible !== false)
    .map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      subtitle: i.subtitle,
      src: mediaUrl(i.file),
      poster: i.poster ? mediaUrl(i.poster) : null,
    }));
  return json({ items }, 200, { "Cache-Control": "no-cache" });
};

export const config: Config = {
  path: "/api/projects",
};
