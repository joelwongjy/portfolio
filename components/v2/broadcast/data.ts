import { organisationToLogo } from "@/constants/logos";
import { experience } from "@/data/experience";
import { Project, project } from "@/data/projects";

import { CHAPTERS } from "../lap";
import { orgName } from "../OrganisationLogo";

export const jobs = experience.experiences
  .filter((e) => e.isShown !== false)
  .slice(0, CHAPTERS.length);

export const projects: Project[] = [
  ...project.favoriteProjects.projects,
  ...project.otherProjects.projects,
];

// team colours for the tower and the trackside boards
const BRAND: Record<string, { color: string; board: string }> = {
  tiktok: { color: "#FE2C55", board: "#141414" },
  kisi: { color: "#5B4FFF", board: "#4A3DEB" },
  propel: { color: "#1FA2DB", board: "#0E5E8E" },
  shopee: { color: "#EE4D2D", board: "#E84A2A" },
  bantu: { color: "#F26B3A", board: "#E2603A" },
  gdsc: { color: "#4285F4", board: "#1A6FE0" },
};

export const brand = (organisation: string) => BRAND[organisation] ?? { color: "#9CA3AF", board: "#374151" };

export const logoSrc = (organisation: string) => {
  const l = organisationToLogo[organisation];
  return typeof l === "string" ? l : l?.src;
};

export const boards = jobs.map((j) => ({
  name: orgName(j.organisation),
  role: j.title,
  color: brand(j.organisation).board,
  logo: logoSrc(j.organisation),
}));

export const GITHUB = "https://github.com/joelwongjy";

/** "Jul 2024" → 2024.5 */
export const yearValue = (s: string) => {
  if (/present/i.test(s)) return new Date().getFullYear() + new Date().getMonth() / 12;
  const m = s.match(/([A-Za-z]{3})\s+(\d{4})/);
  if (!m) return Number(s.match(/\d{4}/)?.[0] ?? 2020);
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return Number(m[2]) + months.indexOf(m[1].toLowerCase()) / 12;
};
