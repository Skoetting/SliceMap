import type { Slice } from './types'

export interface Point {
  x: number
  y: number
}

export function clampPositiveSize(value: number, min = 1): number {
  if (!Number.isFinite(value)) return min
  return Math.max(min, value)
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Local-space corners: TL, TR, BR, BL relative to center before rotation. */
export function localCorners(width: number, height: number): Point[] {
  const hw = width / 2
  const hh = height / 2
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ]
}

export function rotatePoint(p: Point, rotationDeg: number): Point {
  const r = degToRad(rotationDeg)
  const c = Math.cos(r)
  const s = Math.sin(r)
  return {
    x: p.x * c - p.y * s,
    y: p.x * s + p.y * c,
  }
}

/** World-space corners of a slice (TL, TR, BR, BL). */
export function getSliceCorners(slice: Slice): Point[] {
  return localCorners(slice.width, slice.height).map((p) => {
    const r = rotatePoint(p, slice.rotationDeg)
    return { x: r.x + slice.cx, y: r.y + slice.cy }
  })
}

/** Convert a world point into the slice's local (unrotated) coordinates. */
export function worldToLocal(slice: Slice, world: Point): Point {
  const dx = world.x - slice.cx
  const dy = world.y - slice.cy
  const inv = rotatePoint({ x: dx, y: dy }, -slice.rotationDeg)
  return inv
}

export function pointInSlice(slice: Slice, world: Point): boolean {
  const local = worldToLocal(slice, world)
  const hw = slice.width / 2
  const hh = slice.height / 2
  return local.x >= -hw && local.x <= hw && local.y >= -hh && local.y <= hh
}

export function applySliceTransform(
  ctx: CanvasRenderingContext2D,
  slice: Pick<Slice, 'cx' | 'cy' | 'rotationDeg'>,
): void {
  ctx.translate(slice.cx, slice.cy)
  ctx.rotate(degToRad(slice.rotationDeg))
}

export function normalizeRotation(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  let d = deg % 360
  if (d > 180) d -= 360
  if (d < -180) d += 360
  return d
}

/** Top-left of the unrotated slice rectangle in composition pixels. */
export function sliceOffset(
  slice: Pick<Slice, 'cx' | 'cy' | 'width' | 'height'>,
): { offsetX: number; offsetY: number } {
  return {
    offsetX: slice.cx - slice.width / 2,
    offsetY: slice.cy - slice.height / 2,
  }
}

/** Center from unrotated top-left offset and size. */
export function centerFromOffset(
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): { cx: number; cy: number } {
  return {
    cx: offsetX + width / 2,
    cy: offsetY + height / 2,
  }
}
