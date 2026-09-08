/**
 * A damped spring: `x` chases `t`, overshooting a little on the way.
 *
 * Frame-rate independent enough for our purposes: `step` takes `dt` in
 * 60fps frames and sub-steps when a frame arrives late. `k` is the pull
 * toward the target, `d` the per-step velocity damping — lower `d` means
 * a lazier, bouncier settle.
 *
 * Shared by `components/fx/Cursor.tsx` (tilt, squash, sleep pose) and
 * `components/fx/AvatarToy.tsx` (the release-to-home throw).
 */
export class Spring {
  x = 0
  v = 0
  t = 0
  constructor(
    private readonly k: number,
    private readonly d: number,
  ) {}
  step(dt: number): boolean {
    // Sub-step for stability when a frame is late.
    const n = Math.max(1, Math.round(dt))
    for (let i = 0; i < n; i++) {
      this.v = (this.v + (this.t - this.x) * this.k) * this.d
      this.x += this.v
    }
    return Math.abs(this.v) > 0.001 || Math.abs(this.t - this.x) > 0.001
  }
  snap() {
    this.x = this.t
    this.v = 0
  }
}

export default Spring
