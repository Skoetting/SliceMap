import type { Point } from './geometry'
import { normalizeRotation } from './geometry'

const RECT_EPS = 1.5
const ANGLE_DOT_EPS = 0.02

export interface RectFromQuad {
  cx: number
  cy: number
  width: number
  height: number
  rotationDeg: number
}

function dist(a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.hypot(dx, dy)
}

function nearlyEqual(a: number, b: number, eps = RECT_EPS): boolean {
  return Math.abs(a - b) <= eps
}

/**
 * True when four corners form a rectangle (axis-aligned or uniformly rotated):
 * opposite sides equal and adjacent sides roughly perpendicular.
 */
export function isRectangularQuad(points: Point[], eps = RECT_EPS): boolean {
  if (points.length !== 4) return false
  if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return false

  const [a, b, c, d] = points
  const ab = dist(a, b)
  const bc = dist(b, c)
  const cd = dist(c, d)
  const da = dist(d, a)
  if (ab < 1 || bc < 1 || cd < 1 || da < 1) return false
  if (!nearlyEqual(ab, cd, eps) || !nearlyEqual(bc, da, eps)) return false

  // Adjacent edge vectors should be perpendicular (dot ≈ 0)
  const v1x = b.x - a.x
  const v1y = b.y - a.y
  const v2x = c.x - b.x
  const v2y = c.y - b.y
  const len1 = Math.hypot(v1x, v1y)
  const len2 = Math.hypot(v2x, v2y)
  const cos = (v1x * v2x + v1y * v2y) / (len1 * len2)
  return Math.abs(cos) <= ANGLE_DOT_EPS
}

/**
 * Derive center, size, and rotation from a rectangular quad (TL→TR→BR→BL or any winding).
 * Width follows the first edge; height the second. Rotation is the first-edge angle.
 */
export function rectFromRectangularQuad(points: Point[]): RectFromQuad | null {
  if (!isRectangularQuad(points)) return null
  const [a, b, c] = points
  const width = dist(a, b)
  const height = dist(b, c)
  const cx = (a.x + b.x + c.x + points[3].x) / 4
  const cy = (a.y + b.y + c.y + points[3].y) / 4
  const rotationDeg = normalizeRotation(
    (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  )
  return {
    cx: Math.round(cx * 100) / 100,
    cy: Math.round(cy * 100) / 100,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    rotationDeg: Math.round(rotationDeg * 100) / 100,
  }
}

/** Axis-aligned bounding box of points (inclusive extents). */
export function boundsOfPoints(points: Point[]): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} | null {
  if (points.length === 0) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of points) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!Number.isFinite(minX)) return null
  return { minX, minY, maxX, maxY }
}
