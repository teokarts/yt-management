/**
 * Minimal critically-damped spring animator (damping ratio 1.0 — no
 * overshoot), used to hand off gesture velocity when a drag ends so there is
 * no visible seam between the finger and the animation.
 *
 * Parameterized Apple-style: `response` is roughly how long the value takes
 * to reach the target, in seconds (this is not a fixed duration — settle time
 * emerges from the physics).
 */
export interface SpringOptions {
  /** Approximate time to target in seconds. Default 0.35. */
  response?: number;
  /** Initial velocity in units/second (same axis as from/to). */
  velocity?: number;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

/**
 * Animates a scalar from `from` to `to` on requestAnimationFrame.
 * Returns a cancel function; re-invoking with a new target mid-flight is safe
 * if you cancel first and pass the current value/velocity (velocity handoff).
 */
export function animateSpring(from: number, to: number, opts: SpringOptions): () => void {
  const response = Math.max(opts.response ?? 0.35, 0.01);
  const omega = (2 * Math.PI) / response;
  const d0 = from - to;
  // Closed-form critically damped solution: x(t) = to + (d0 + B·t)·e^(−ωt)
  const b = (opts.velocity ?? 0) + omega * d0;

  let raf = 0;
  let start: number | null = null;

  const step = (now: number) => {
    if (start === null) start = now;
    const t = (now - start) / 1000;
    const value = to + (d0 + b * t) * Math.exp(-omega * t);
    opts.onUpdate(value);

    // Settled when close enough to the target and velocity has decayed.
    const speed = Math.abs(-omega * (d0 + b * t) + b) * Math.exp(-omega * t);
    if (Math.abs(value - to) < 0.1 && speed < 1) {
      opts.onUpdate(to);
      opts.onComplete?.();
      return;
    }
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

/** Progressive resistance past a boundary — soft stops, never hard ones. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}
