import { ProjectIcon } from "../../projectIcons";

// What the app asks of the 3D scene. The app writes these fields and calls
// wake(); the scene reads them every frame, so nothing re-renders React.

export type MapMode = "grid" | "race" | "pits" | "overview";

export interface SceneCtrl {
  mode: MapMode;
  /** lap time (s) the car is scrubbing toward, in race mode */
  target: number;
  /** when true the scene advances target in real time × rate */
  playing: boolean;
  rate: number;
  /** put the car at this lap time on the next frame */
  jump: number | null;
  /** the selected garage in pits mode */
  project: number | null;
  /** pits overview: metres slid along the pit lane by dragging */
  pitPan: number;
  /** start lights lit, 0–5 */
  lights: number;
  /** bump to make the camera fly to the current mode's shot */
  shot: number;
}

export const initialCtrl = (): SceneCtrl => ({
  mode: "grid",
  target: 0,
  playing: false,
  rate: 1,
  jump: null,
  project: null,
  pitPan: 0,
  lights: 0,
  shot: 0,
});

export interface Telemetry {
  /** lap time the car is at (s) */
  t: number;
  /** car's lap distance (m) */
  d: number;
  playing: boolean;
}

export interface PinInfo {
  label: string;
  sub?: string;
  logo?: string;
  color?: string;
  icon?: ProjectIcon;
}
