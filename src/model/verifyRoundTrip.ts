import { createDefaultProject, createSlice } from './project'
import { parseProject, roundTripProject } from './persistence'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export function verifyRoundTrip(): void {
  const project = createDefaultProject()
  project.name = 'roundtrip-show'
  project.composition = { width: 1920, height: 1080 }
  project.export.strokeWidth = 4
  project.export.frameBorderPx = 20
  project.export.design = 'caro'
  project.export.showDimensions = false
  project.export.animation = {
    enabled: true,
    style: 'pulse',
    periodSec: 2.5,
  }
  project.export.video = { fps: 24 }
  project.export.guides = {
    enabled: true,
    showCross: false,
    showCircle: true,
    showLabelPlate: false,
  }
  project.slices = [
    createSlice(project.composition, 0, {
      name: 'Center',
      cx: 960,
      cy: 540,
      width: 800,
      height: 450,
      rotationDeg: 15,
      color: '#3B82F6',
    }),
    createSlice(project.composition, 1, {
      name: 'Side',
      cx: 300,
      cy: 200,
      width: 200,
      height: 400,
      rotationDeg: -30.5,
      color: '#22C55E',
    }),
  ]

  const restored = roundTripProject(project)
  assert(restored.version === 1, 'version')
  assert(restored.name === project.name, 'name')
  assert(restored.composition.width === 1920, 'width')
  assert(restored.composition.height === 1080, 'height')
  assert(restored.export.strokeWidth === 4, 'stroke')
  assert(restored.export.frameBorderPx === 20, 'frameBorderPx')
  assert(restored.export.design === 'caro', 'design')
  assert(restored.export.showDimensions === false, 'showDimensions')
  assert(restored.export.animation.enabled === true, 'animation.enabled')
  assert(restored.export.animation.style === 'pulse', 'animation.style')
  assert(restored.export.animation.periodSec === 2.5, 'animation.periodSec')
  assert(restored.export.video.fps === 24, 'video.fps')
  assert(restored.export.guides.enabled === true, 'guides.enabled')
  assert(restored.export.guides.showCross === false, 'guides.showCross')
  assert(restored.export.guides.showCircle === true, 'guides.showCircle')
  assert(restored.export.guides.showLabelPlate === false, 'guides.showLabelPlate')
  assert(restored.slices.length === 2, 'slice count')

  for (let i = 0; i < project.slices.length; i++) {
    const a = project.slices[i]
    const b = restored.slices[i]
    assert(a.id === b.id, `id ${i}`)
    assert(a.name === b.name, `name ${i}`)
    assert(a.cx === b.cx, `cx ${i}`)
    assert(a.cy === b.cy, `cy ${i}`)
    assert(a.width === b.width, `width ${i}`)
    assert(a.height === b.height, `height ${i}`)
    assert(a.rotationDeg === b.rotationDeg, `rot ${i}`)
    assert(a.color === b.color, `color ${i}`)
  }

  // Legacy projects omit design / showDimensions / animation / video → defaults
  const legacyResult = parseProject({
    version: 1,
    name: 'legacy',
    composition: { width: 100, height: 100 },
    slices: [],
    export: { strokeWidth: 2 },
  })
  assert(legacyResult.ok, 'legacy ok')
  if (legacyResult.ok) {
    assert(legacyResult.project.export.design === 'simple', 'legacy design')
    assert(legacyResult.project.export.showDimensions === true, 'legacy dims')
    assert(legacyResult.project.export.strokeWidth === 2, 'legacy stroke')
    assert(legacyResult.project.export.frameBorderPx === 12, 'legacy frameBorderPx default')
    assert(legacyResult.project.export.animation.enabled === false, 'legacy anim off')
    assert(legacyResult.project.export.animation.style === 'phase-scroll', 'legacy anim style')
    assert(legacyResult.project.export.animation.periodSec === 4, 'legacy period')
    assert(legacyResult.project.export.video.fps === 30, 'legacy fps')
    assert(legacyResult.project.export.guides.enabled === true, 'legacy guides on')
    assert(legacyResult.project.export.guides.showCross === true, 'legacy showCross')
    assert(legacyResult.project.export.guides.showCircle === true, 'legacy showCircle')
    assert(legacyResult.project.export.guides.showLabelPlate === true, 'legacy label plate')
  }

  const unknownDesign = parseProject({
    version: 1,
    name: 'unknown-design',
    composition: { width: 100, height: 100 },
    slices: [],
    export: { strokeWidth: 3, design: 'dots', showDimensions: true },
  })
  assert(unknownDesign.ok, 'unknown design ok')
  if (unknownDesign.ok) {
    assert(unknownDesign.project.export.design === 'simple', 'unknown design fallback')
  }

  const clamped = parseProject({
    version: 1,
    name: 'clamped',
    composition: { width: 100, height: 100 },
    slices: [],
    export: {
      strokeWidth: 3,
      animation: { enabled: true, style: 'wipe', periodSec: -1 },
      video: { fps: 120 },
      frameBorderPx: 9999,
    },
  })
  assert(clamped.ok, 'clamped ok')
  if (clamped.ok) {
    assert(clamped.project.export.animation.style === 'phase-scroll', 'unknown style fallback')
    assert(clamped.project.export.animation.periodSec === 4, 'bad period fallback')
    assert(clamped.project.export.video.fps === 60, 'fps clamp high')
    assert(clamped.project.export.frameBorderPx === 512, 'frameBorderPx clamp high')
  }
}
