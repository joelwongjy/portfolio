// One lap of Monaco. Each career chapter sits at a real corner, and lap
// "progress" (driven by scrolling in race mode) is shared out evenly between
// chapters, so the long run through the tunnel takes no more scrolling than
// the hop from Mirabeau to the hairpin.

export const LAP_LENGTH = 3332;

// distances are metres from the timing line
export const CHAPTERS = [
  { at: 206, turn: 1, corner: "Sainte Dévote", dir: "right" },
  { at: 893, turn: 4, corner: "Casino Square", dir: "right" },
  { at: 1263, turn: 6, corner: "Fairmont Hairpin", dir: "left" },
  { at: 1638, turn: 9, corner: "The Tunnel", dir: "right" },
  { at: 2103, turn: 10, corner: "Nouvelle Chicane", dir: "left" },
  { at: 2553, turn: 13, corner: "Piscine", dir: "left" },
  { at: 2922, turn: 18, corner: "La Rascasse", dir: "right" },
] as const;

const INTRO = 0;
const OUTRO = 0;

const knots = (() => {
  const n = CHAPTERS.length;
  const span = 1 - INTRO - OUTRO;
  const k: [number, number][] = [[INTRO, 0]];
  CHAPTERS.forEach((c, i) => k.push([INTRO + (span * (i + 1)) / (n + 1), c.at]));
  k.push([1 - OUTRO, LAP_LENGTH]);
  return k;
})();

// monotone cubic (Fritsch–Carlson) so the car's speed never jolts at a knot
const slopes = (() => {
  const n = knots.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push((knots[i + 1][1] - knots[i][1]) / (knots[i + 1][0] - knots[i][0]));
  }
  const m: number[] = [d[0]];
  for (let i = 1; i < n - 1; i++) {
    m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  }
  m.push(d[n - 2]);
  // ease off the line and into the finish
  m[0] = 0;
  return m;
})();

/** lap distance in metres for a scroll fraction 0..1 */
export const lapDistance = (p: number) => {
  if (p <= knots[0][0]) return 0;
  const last = knots[knots.length - 1];
  if (p >= last[0]) return LAP_LENGTH;
  let i = 0;
  while (p > knots[i + 1][0]) i++;
  const [x0, y0] = knots[i];
  const [x1, y1] = knots[i + 1];
  const h = x1 - x0;
  const t = (p - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * slopes[i] +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * slopes[i + 1]
  );
};

/** the scroll fraction at which the car reaches chapter i */
export const chapterProgress = (i: number) => knots[i + 1][0];

/** the chapter the car is approaching or passing, -1 before the first */
export const chapterAt = (p: number) => {
  let idx = -1;
  const lead = (1 - INTRO - OUTRO) / (CHAPTERS.length + 1) / 3;
  CHAPTERS.forEach((_, i) => {
    if (p + lead >= chapterProgress(i)) idx = i;
  });
  return idx;
};

/** the lap progress (0..1) at which the car reaches lap distance d */
export const progressAt = (d: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (lapDistance(mid) < d) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
