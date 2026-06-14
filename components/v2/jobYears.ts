// Condense a job's start/end labels (e.g. "Jul 2024" / "Present") into a tidy
// year range for the HUD and the trackside banners.
const yearOf = (s: string) => s.match(/\d{4}/)?.[0] ?? s;

export const jobYears = (start: string, end: string) => {
  const a = yearOf(start);
  const b = yearOf(end);
  return a === b ? a : `${a} — ${b}`;
};
