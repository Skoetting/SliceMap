import { centerFromOffset, sliceOffset } from '../model/geometry'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function approx(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) <= eps
}

// Even size: offset (100, 50) + 200×100 → center (200, 100)
{
  const center = centerFromOffset(100, 50, 200, 100)
  assert(approx(center.cx, 200) && approx(center.cy, 100), 'even size centerFromOffset')
  const offset = sliceOffset({ ...center, width: 200, height: 100 })
  assert(approx(offset.offsetX, 100) && approx(offset.offsetY, 50), 'even size round-trip')
}

// Odd dimensions: half-pixel centers
{
  const center = centerFromOffset(10, 20, 101, 51)
  assert(approx(center.cx, 60.5) && approx(center.cy, 45.5), 'odd size centerFromOffset')
  const offset = sliceOffset({ ...center, width: 101, height: 51 })
  assert(approx(offset.offsetX, 10) && approx(offset.offsetY, 20), 'odd size round-trip')
}

// Known center → offset
{
  const offset = sliceOffset({ cx: 960, cy: 540, width: 400, height: 200 })
  assert(approx(offset.offsetX, 760) && approx(offset.offsetY, 440), 'center to offset')
  const center = centerFromOffset(offset.offsetX, offset.offsetY, 400, 200)
  assert(approx(center.cx, 960) && approx(center.cy, 540), 'offset back to center')
}

console.log('All offset conversion tests passed.')
