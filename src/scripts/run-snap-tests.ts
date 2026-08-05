import {
  applyMoveSnap,
  collectSnapGuides,
  sliceAabb,
} from '../model/snap'
import type { Composition, Slice } from '../model/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps
}

function makeSlice(partial: Partial<Slice> & Pick<Slice, 'id' | 'cx' | 'cy' | 'width' | 'height'>): Slice {
  return {
    name: partial.name ?? partial.id,
    rotationDeg: partial.rotationDeg ?? 0,
    color: partial.color ?? '#3B82F6',
    ...partial,
  }
}

const composition: Composition = { width: 1920, height: 1080 }

// --- AABB ---
{
  const s = makeSlice({ id: 'a', cx: 100, cy: 80, width: 40, height: 20 })
  const box = sliceAabb(s)
  assert(approx(box.left, 80) && approx(box.right, 120), 'AABB left/right')
  assert(approx(box.top, 70) && approx(box.bottom, 90), 'AABB top/bottom')
}

// --- Guides include borders, midlines, neighbor edges ---
{
  const other = makeSlice({ id: 'b', cx: 400, cy: 300, width: 100, height: 50 })
  const guides = collectSnapGuides(composition, [other])
  const xs = guides.filter((g) => g.axis === 'x').map((g) => g.value)
  const ys = guides.filter((g) => g.axis === 'y').map((g) => g.value)
  assert(xs.includes(0) && xs.includes(960) && xs.includes(1920), 'composition X guides')
  assert(ys.includes(0) && ys.includes(540) && ys.includes(1080), 'composition Y guides')
  assert(xs.includes(350) && xs.includes(450), 'neighbor X edges')
  assert(ys.includes(275) && ys.includes(325), 'neighbor Y edges')
}

// --- Snap to composition border ---
{
  const moving = makeSlice({ id: 'm', cx: 200, cy: 200, width: 100, height: 80 })
  // left edge at proposedCx - 50; near x=0 when proposedCx ≈ 50
  const result = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 54,
    proposedCy: 200,
    threshold: 10,
  })
  assert(approx(result.cx, 50), `border snap cx got ${result.cx}`)
  assert(approx(result.cy, 200), 'border snap cy unchanged')
  assert(result.guides.some((g) => g.axis === 'x' && g.value === 0), 'active X guide at 0')
}

// --- Snap to another slice edge ---
{
  const moving = makeSlice({ id: 'm', cx: 200, cy: 200, width: 100, height: 80 })
  const neighbor = makeSlice({ id: 'n', cx: 400, cy: 200, width: 100, height: 80 })
  // neighbor left = 350; moving right = proposedCx + 50 → snap when proposedCx ≈ 300
  const result = applyMoveSnap({
    moving,
    others: [neighbor],
    composition,
    proposedCx: 305,
    proposedCy: 200,
    threshold: 10,
  })
  assert(approx(result.cx, 300), `neighbor snap cx got ${result.cx}`)
  assert(result.guides.some((g) => g.axis === 'x' && g.value === 350), 'guide at neighbor left')
}

// --- No snap outside threshold ---
{
  const moving = makeSlice({ id: 'm', cx: 200, cy: 200, width: 100, height: 80 })
  const result = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 80,
    proposedCy: 200,
    threshold: 10,
  })
  assert(approx(result.cx, 80) && approx(result.cy, 200), 'no snap outside threshold')
  assert(result.guides.length === 0, 'no active guides')
}

// --- Dual-axis corner snap ---
{
  const moving = makeSlice({ id: 'm', cx: 200, cy: 200, width: 100, height: 80 })
  // left→0 needs cx=50; top→0 needs cy=40
  const result = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 55,
    proposedCy: 46,
    threshold: 10,
  })
  assert(approx(result.cx, 50), `corner snap cx got ${result.cx}`)
  assert(approx(result.cy, 40), `corner snap cy got ${result.cy}`)
  assert(
    result.guides.some((g) => g.axis === 'x' && g.value === 0) &&
      result.guides.some((g) => g.axis === 'y' && g.value === 0),
    'both axes active',
  )
}

// --- Threshold scales with zoom (screen px → world units) ---
{
  const moving = makeSlice({ id: 'm', cx: 200, cy: 200, width: 100, height: 80 })
  // left edge offset from border: proposedCx=50+8 → dist 8 world units
  const near = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 58,
    proposedCy: 200,
    threshold: 10 / 1, // 100% zoom → 10 world px
  })
  assert(approx(near.cx, 50), 'snaps at 100% with 8px world gap')

  const farAtZoom = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 58,
    proposedCy: 200,
    threshold: 10 / 0.5, // 50% zoom → 20 world px (same on-screen feel)
  })
  assert(approx(farAtZoom.cx, 50), 'same on-screen gap still snaps when zoomed out')

  const missAtFullZoom = applyMoveSnap({
    moving,
    others: [],
    composition,
    proposedCx: 70,
    proposedCy: 200,
    threshold: 10 / 1,
  })
  assert(approx(missAtFullZoom.cx, 70), '20 world px gap does not snap at 100%')
}

console.log('snap tests OK')
