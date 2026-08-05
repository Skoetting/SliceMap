import {
  buildZipStore,
  effectiveFrameBorder,
  sanitizeFrameBaseName,
  uniqueFrameFilenames,
} from '../model/exportFrames'
import { clampFrameBorderPx } from '../model/types'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

assert(clampFrameBorderPx(12) === 12, 'default-ish clamp')
assert(clampFrameBorderPx(0) === 12, 'bad → default')
assert(clampFrameBorderPx(9999) === 512, 'max clamp')

const ok = effectiveFrameBorder(400, 200, 12)
assert(ok.border === 12 && !ok.clamped, 'normal border')

const tight = effectiveFrameBorder(40, 40, 30)
assert(tight.clamped, 'should clamp')
assert(tight.border === 19, `max hollow border got ${tight.border}`) // floor((40-1)/2)=19

assert(sanitizeFrameBaseName('Left Panel!') === 'Left_Panel', 'sanitize')
assert(sanitizeFrameBaseName('   ') === 'slice', 'empty name')

const names = uniqueFrameFilenames([
  { name: 'A' },
  { name: 'A' },
  { name: 'B' },
])
assert(names[0] === 'frame-A.png', names[0])
assert(names[1] === 'frame-A-2.png', names[1])
assert(names[2] === 'frame-B.png', names[2])

const zip = buildZipStore([
  { name: 'a.txt', data: new TextEncoder().encode('hi') },
  { name: 'b.txt', data: new TextEncoder().encode('bye') },
])
assert(zip.type === 'application/zip', 'zip mime')
assert(zip.size > 40, 'zip has payload')

console.log('frame-export tests OK')
