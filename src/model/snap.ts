import { getSliceCorners } from './geometry'
import type { Composition, Slice } from './types'

export interface Aabb {
  left: number
  right: number
  top: number
  bottom: number
}

export type SnapGuide =
  | { axis: 'x'; value: number }
  | { axis: 'y'; value: number }

export type SliceGeometry = Pick<Slice, 'cx' | 'cy' | 'width' | 'height' | 'rotationDeg'>

/** Axis-aligned bounding box from a slice's world corners. */
export function sliceAabb(slice: SliceGeometry): Aabb {
  const corners = getSliceCorners(slice as Slice)
  let left = Infinity
  let right = -Infinity
  let top = Infinity
  let bottom = -Infinity
  for (const c of corners) {
    if (c.x < left) left = c.x
    if (c.x > right) right = c.x
    if (c.y < top) top = c.y
    if (c.y > bottom) bottom = c.y
  }
  return { left, right, top, bottom }
}

/** Composition borders, midlines, and other slices' AABB edges. */
export function collectSnapGuides(
  composition: Composition,
  others: readonly SliceGeometry[],
): SnapGuide[] {
  const guides: SnapGuide[] = [
    { axis: 'x', value: 0 },
    { axis: 'x', value: composition.width / 2 },
    { axis: 'x', value: composition.width },
    { axis: 'y', value: 0 },
    { axis: 'y', value: composition.height / 2 },
    { axis: 'y', value: composition.height },
  ]

  for (const other of others) {
    const box = sliceAabb(other)
    guides.push(
      { axis: 'x', value: box.left },
      { axis: 'x', value: box.right },
      { axis: 'y', value: box.top },
      { axis: 'y', value: box.bottom },
    )
  }

  return guides
}

interface AxisSnap {
  delta: number
  guide: number
}

function bestAxisSnap(
  edges: readonly number[],
  guides: readonly number[],
  threshold: number,
): AxisSnap | null {
  let best: AxisSnap | null = null
  for (const edge of edges) {
    for (const guide of guides) {
      const delta = guide - edge
      const dist = Math.abs(delta)
      if (dist > threshold) continue
      if (!best || dist < Math.abs(best.delta)) {
        best = { delta, guide }
      }
    }
  }
  return best
}

export interface ApplyMoveSnapArgs {
  moving: Pick<Slice, 'width' | 'height' | 'rotationDeg'>
  others: readonly SliceGeometry[]
  composition: Composition
  proposedCx: number
  proposedCy: number
  /** World-unit snap radius (already converted from screen pixels if needed). */
  threshold: number
}

export interface ApplyMoveSnapResult {
  cx: number
  cy: number
  guides: SnapGuide[]
}

/**
 * Soft magnetic snap for move drags. Nudges proposed center so AABB edges
 * align with nearby guides. X and Y resolve independently (closest wins).
 */
export function applyMoveSnap({
  moving,
  others,
  composition,
  proposedCx,
  proposedCy,
  threshold,
}: ApplyMoveSnapArgs): ApplyMoveSnapResult {
  if (!(threshold > 0) || !Number.isFinite(threshold)) {
    return { cx: proposedCx, cy: proposedCy, guides: [] }
  }

  const allGuides = collectSnapGuides(composition, others)
  const box = sliceAabb({
    ...moving,
    cx: proposedCx,
    cy: proposedCy,
  })

  const xGuides = allGuides.filter((g) => g.axis === 'x').map((g) => g.value)
  const yGuides = allGuides.filter((g) => g.axis === 'y').map((g) => g.value)

  const xSnap = bestAxisSnap([box.left, box.right], xGuides, threshold)
  const ySnap = bestAxisSnap([box.top, box.bottom], yGuides, threshold)

  const guides: SnapGuide[] = []
  if (xSnap) guides.push({ axis: 'x', value: xSnap.guide })
  if (ySnap) guides.push({ axis: 'y', value: ySnap.guide })

  return {
    cx: proposedCx + (xSnap?.delta ?? 0),
    cy: proposedCy + (ySnap?.delta ?? 0),
    guides,
  }
}

/** Default on-screen snap radius in CSS pixels. */
export const SNAP_SCREEN_PX = 10
