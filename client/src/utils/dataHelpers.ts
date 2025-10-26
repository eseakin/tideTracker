import { Point } from "#customTypes/dataTypes"

type Extreme = { t: string; v: string; type: "H" | "L" }

export function parseExtremes(raw: Extreme[]) {
  return raw
    .map((x) => ({
      t: new Date(x.t.replace(" ", "T")).getTime(), // assumes local station time
      h: Number(x.v),
      type: x.type,
    }))
    .sort((a, b) => a.t - b.t)
}

// Generate samples every `stepMin` minutes between each consecutive extreme.
export function upsampleExtremesToSeries(
  extremes: ReturnType<typeof parseExtremes>,
  stepMin = 15
) {
  const points: { t: number; h: number }[] = []
  for (let i = 0; i < extremes.length - 1; i++) {
    const a = extremes[i]
    const b = extremes[i + 1]
    const dt = b.t - a.t
    if (dt <= 0) continue

    const stepMs = stepMin * 60 * 1000
    for (let t = a.t; t < b.t; t += stepMs) {
      const x = (t - a.t) / dt // 0..1
      const h = (a.h + b.h) / 2 + ((a.h - b.h) / 2) * Math.cos(Math.PI * x)
      points.push({ t, h })
    }
  }
  // include the last extreme exactly
  const last = extremes[extremes.length - 1]
  points.push({ t: last.t, h: last.h })
  return points
}

// Linear interpolation on the sampled series
export function interpAt(t: number, pts: Point[]) {
  if (!pts.length) return NaN
  if (t <= pts[0].t) return pts[0].h
  if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].h
  const i = pts.findIndex((p) => p.t >= t)
  const a = pts[i - 1]
  const b = pts[i]
  const x = (t - a.t) / (b.t - a.t)
  return a.h + x * (b.h - a.h)
}
