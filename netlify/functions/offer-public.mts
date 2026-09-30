import type { Config } from "@netlify/functions";
import { currentOffer, json, projectsStore, readOffer } from "../lib/projects-store.mts";

/** Public: the seasonal offer running today (or { offer: null }). */
export default async () => {
  const offer = currentOffer(await readOffer(projectsStore()));
  return json({ offer }, 200, { "Cache-Control": "no-cache" });
};

export const config: Config = {
  path: "/api/offer",
};
