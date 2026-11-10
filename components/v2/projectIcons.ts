// 24×24 glyphs for each project, usable as SVG paths in the UI and as
// Path2D on the 3D garage fascias. Stroke them (width 2, round caps).
export const PROJECT_ICONS = {
  // code brackets
  code: "M8 6 L2 12 L8 18 M16 6 L22 12 L16 18 M14 4 L10 20",
  // a stopwatch
  countdown: "M12 22 A8 8 0 1 0 12 6 A8 8 0 1 0 12 22 Z M12 10 V14 L15 16 M9 2 H15 M12 2 V6",
  // a bowl with steam
  supper: "M3 12 H21 A9 9 0 0 1 3 12 Z M8 8 C8 6 10 6 10 4 M13 8 C13 6 15 6 15 4",
  // a play button
  play: "M3 6 A3 3 0 0 1 6 3 H18 A3 3 0 0 1 21 6 V18 A3 3 0 0 1 18 21 H6 A3 3 0 0 1 3 18 Z M10 8.5 L16 12 L10 15.5 Z",
} as const;

export type ProjectIcon = keyof typeof PROJECT_ICONS;
