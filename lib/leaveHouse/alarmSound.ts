// The actual "alarm" noise. We synthesize a repeating two-tone beep with the
// Web Audio API instead of shipping an audio file — it's a few bytes of code,
// needs no asset, and plays at full volume. Returns a stop() handle.
//
// NOTE: browsers require a user gesture before audio can start. The UI primes
// the AudioContext on first tap ("Enable sound") so the alarm can ring later.

type AudioCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioCtor | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtor })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

/** Call from a user gesture so the context is unlocked for later alarms. */
export function primeAudio(): boolean {
  const c = getCtx();
  if (!c) return false;
  if (c.state === "suspended") void c.resume();
  return true;
}

export interface AlarmHandle {
  stop(): void;
}

export function startAlarm(): AlarmHandle {
  const c = getCtx();
  if (!c) return { stop() {} };
  if (c.state === "suspended") void c.resume();

  const gain = c.createGain();
  gain.gain.value = 0.0001;
  gain.connect(c.destination);

  const osc = c.createOscillator();
  osc.type = "square";
  osc.connect(gain);
  osc.start();

  // Pulse the gain on/off to make an urgent beeping pattern, alternating pitch.
  let on = false;
  let highTone = true;
  const tick = () => {
    const t = c.currentTime;
    if (on) {
      gain.gain.setTargetAtTime(0.0001, t, 0.01);
    } else {
      osc.frequency.setValueAtTime(highTone ? 880 : 660, t);
      gain.gain.setTargetAtTime(0.25, t, 0.01);
      highTone = !highTone;
    }
    on = !on;
  };
  tick();
  const interval = window.setInterval(tick, 350);

  return {
    stop() {
      window.clearInterval(interval);
      try {
        gain.gain.setTargetAtTime(0.0001, c.currentTime, 0.01);
        osc.stop(c.currentTime + 0.05);
      } catch {
        /* already stopped */
      }
    },
  };
}
