import { slicesOverlap } from '../model/overlap'
import type { Slice } from '../model/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function rect(
  partial: Pick<Slice, 'cx' | 'cy' | 'width' | 'height'> & Partial<Slice>,
): Slice {
  return {
    id: partial.id ?? 's',
    name: partial.name ?? 'S',
    cx: partial.cx,
    cy: partial.cy,
    width: partial.width,
    height: partial.height,
    rotationDeg: partial.rotationDeg ?? 0,
    color: partial.color ?? '#fff',
  }
}

// Flush shared vertical edge (snapped borders) — must NOT overlap
const left = rect({ id: 'a', name: 'A', cx: 100, cy: 100, width: 100, height: 80 })
const right = rect({ id: 'b', name: 'B', cx: 200, cy: 100, width: 100, height: 80 })
assert(!slicesOverlap(left, right), 'flush vertical edge should not overlap')

// Flush shared horizontal edge
const top = rect({ id: 't', name: 'T', cx: 100, cy: 100, width: 80, height: 100 })
const bottom = rect({ id: 'b', name: 'B', cx: 100, cy: 200, width: 80, height: 100 })
assert(!slicesOverlap(top, bottom), 'flush horizontal edge should not overlap')

// Real area overlap
const mid = rect({ id: 'm', name: 'M', cx: 150, cy: 100, width: 100, height: 80 })
assert(slicesOverlap(left, mid), 'overlapping interiors should overlap')

// Tiny float touch (within epsilon)
const almost = rect({
  id: 'f',
  name: 'F',
  cx: 200 + 1e-4,
  cy: 100,
  width: 100,
  height: 80,
})
assert(!slicesOverlap(left, almost), 'near-flush edge within epsilon should not overlap')

console.log('overlap tests OK')
