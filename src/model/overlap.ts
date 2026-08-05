import { getSliceCorners, type Point } from './geometry'
import type { Slice } from './types'

/** Treat flush / near-flush edges as non-overlapping (snapped borders). */
const TOUCH_EPS = 1e-3

function project(axis: Point, corners: Point[]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const p of corners) {
    const d = p.x * axis.x + p.y * axis.y
    if (d < min) min = d
    if (d > max) max = d
  }
  return { min, max }
}

function axesFromCorners(corners: Point[]): Point[] {
  const axes: Point[] = []
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % corners.length]
    const edge = { x: b.x - a.x, y: b.y - a.y }
    const len = Math.hypot(edge.x, edge.y) || 1
    // Perpendicular axis
    axes.push({ x: -edge.y / len, y: edge.x / len })
  }
  return axes
}

/**
 * Separating-axis test for two convex quads (rotated rects).
 * Edges that touch or nearly touch (snapped flush) do NOT count as overlap.
 */
export function slicesOverlap(a: Slice, b: Slice): boolean {
  const ca = getSliceCorners(a)
  const cb = getSliceCorners(b)
  const axes = [...axesFromCorners(ca), ...axesFromCorners(cb)]

  for (const axis of axes) {
    const pa = project(axis, ca)
    const pb = project(axis, cb)
    // <= so max === min (shared border) is separated, not intersecting
    if (pa.max <= pb.min + TOUCH_EPS || pb.max <= pa.min + TOUCH_EPS) {
      return false
    }
  }
  return true
}

export function findOverlappingPairs(
  slices: Slice[],
): Array<{ a: Slice; b: Slice }> {
  const pairs: Array<{ a: Slice; b: Slice }> = []
  for (let i = 0; i < slices.length; i++) {
    for (let j = i + 1; j < slices.length; j++) {
      if (slicesOverlap(slices[i], slices[j])) {
        pairs.push({ a: slices[i], b: slices[j] })
      }
    }
  }
  return pairs
}
