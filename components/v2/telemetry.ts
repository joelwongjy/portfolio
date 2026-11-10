// Max Verstappen's pole lap from 2023 Monaco qualifying (1:11.365, 0.084 s
// ahead of Fernando Alonso), from OpenF1 car data at ~4 Hz. Distances are
// metres from the timing line, rescaled to the 3D circuit's length.

export interface DriverLap {
  number: number;
  lapTime: number;
  sectors: [number, number, number];
  t: number[];
  d: number[];
  speed: number[];
  gear: number[];
  throttle: number[];
  brake: number[];
  rpm: number[];
  drs: number[];
}

export interface LapFile {
  source: string;
  event: string;
  drivers: { VER: DriverLap; ALO: DriverLap };
}

export interface CarSample {
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  rpm: number;
  drs: boolean;
}

let pending: Promise<LapFile> | null = null;
export const loadLap = () => {
  if (!pending) {
    pending = fetch("/monaco/lap-2023-q3.json")
      .then((r) => {
        if (!r.ok) throw new Error(`lap ${r.status}`);
        return r.json() as Promise<LapFile>;
      })
      .catch((e) => {
        pending = null;
        throw e;
      });
  }
  return pending;
};

// index of the last sample at or before x in a sorted array
const seek = (arr: number[], x: number) => {
  let lo = 0;
  let hi = arr.length - 1;
  if (x <= arr[0]) return 0;
  if (x >= arr[hi]) return hi - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid;
    else hi = mid;
  }
  return lo;
};

const lerpAt = (xs: number[], ys: number[], x: number) => {
  const i = seek(xs, x);
  const f = Math.max(0, Math.min(1, (x - xs[i]) / (xs[i + 1] - xs[i] || 1)));
  return ys[i] + (ys[i + 1] - ys[i]) * f;
};

/** lap distance (m) at lap time t (s) */
export const distanceAt = (lap: DriverLap, t: number) => lerpAt(lap.t, lap.d, t);
/** lap time (s) at lap distance d (m) */
export const timeAt = (lap: DriverLap, d: number) => lerpAt(lap.d, lap.t, d);

export const sampleAt = (lap: DriverLap, t: number): CarSample => {
  const i = seek(lap.t, t);
  const near = t - lap.t[i] < lap.t[i + 1] - t ? i : i + 1;
  return {
    speed: Math.round(lerpAt(lap.t, lap.speed, t)),
    gear: lap.gear[near],
    throttle: Math.round(lerpAt(lap.t, lap.throttle, t)),
    brake: lap.brake[near] ? 100 : 0,
    rpm: Math.round(lerpAt(lap.t, lap.rpm, t)),
    // DRS codes 10–14 mean the flap is open
    drs: lap.drs[near] >= 10,
  };
};

/** Max's gap to Alonso at the same point on track (s); negative = ahead */
export const deltaAt = (file: LapFile, t: number) => {
  const d = distanceAt(file.drivers.VER, t);
  return t - timeAt(file.drivers.ALO, d);
};

export const formatLapTime = (t: number) => {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}:${rest.toFixed(3).padStart(6, "0")}`;
};
