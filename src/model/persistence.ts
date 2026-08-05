import {
  ANIMATION_STYLES,
  DEFAULT_ANIMATION,
  DEFAULT_FRAME_BORDER_PX,
  DEFAULT_GUIDES,
  DEFAULT_VIDEO,
  PROJECT_VERSION,
  SLICE_DESIGNS,
  clampFps,
  clampFrameBorderPx,
  clampPeriodSec,
  type AnimationSettings,
  type AnimationStyle,
  type GuideSettings,
  type Slice,
  type SliceDesign,
  type SliceMapProject,
  type VideoSettings,
} from './types'
import { clampPositiveSize } from './geometry'

function parseSliceDesign(value: unknown): SliceDesign {
  if (typeof value === 'string' && (SLICE_DESIGNS as readonly string[]).includes(value)) {
    return value as SliceDesign
  }
  return 'simple'
}

function parseAnimationStyle(value: unknown): AnimationStyle {
  if (
    typeof value === 'string' &&
    (ANIMATION_STYLES as readonly string[]).includes(value)
  ) {
    return value as AnimationStyle
  }
  return DEFAULT_ANIMATION.style
}

function parseAnimation(raw: unknown): AnimationSettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_ANIMATION }
  }
  const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : false
  const style = parseAnimationStyle(raw.style)
  let periodSec = DEFAULT_ANIMATION.periodSec
  if (typeof raw.periodSec === 'number' && Number.isFinite(raw.periodSec) && raw.periodSec > 0) {
    periodSec = clampPeriodSec(raw.periodSec)
  }
  return { enabled, style, periodSec }
}

function parseVideo(raw: unknown): VideoSettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_VIDEO }
  }
  if (typeof raw.fps === 'number' && Number.isFinite(raw.fps)) {
    return { fps: clampFps(raw.fps) }
  }
  return { ...DEFAULT_VIDEO }
}

function parseGuides(raw: unknown): GuideSettings {
  if (!isRecord(raw)) {
    return { ...DEFAULT_GUIDES }
  }
  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_GUIDES.enabled,
    showCross: typeof raw.showCross === 'boolean' ? raw.showCross : DEFAULT_GUIDES.showCross,
    showCircle:
      typeof raw.showCircle === 'boolean' ? raw.showCircle : DEFAULT_GUIDES.showCircle,
    showLabelPlate:
      typeof raw.showLabelPlate === 'boolean'
        ? raw.showLabelPlate
        : DEFAULT_GUIDES.showLabelPlate,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseSlice(raw: unknown): Slice | null {
  if (!isRecord(raw)) return null
  const {
    id,
    name,
    cx,
    cy,
    width,
    height,
    rotationDeg,
    color,
  } = raw

  if (typeof id !== 'string' || id.length === 0) return null
  if (typeof name !== 'string') return null
  if (typeof cx !== 'number' || !Number.isFinite(cx)) return null
  if (typeof cy !== 'number' || !Number.isFinite(cy)) return null
  if (typeof width !== 'number' || !Number.isFinite(width) || width <= 0) return null
  if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) return null
  if (typeof rotationDeg !== 'number' || !Number.isFinite(rotationDeg)) return null
  if (typeof color !== 'string' || color.length === 0) return null

  return {
    id,
    name,
    cx,
    cy,
    width: clampPositiveSize(width),
    height: clampPositiveSize(height),
    rotationDeg,
    color,
  }
}

export function parseProject(data: unknown):
  | { ok: true; project: SliceMapProject }
  | { ok: false; error: string } {
  if (!isRecord(data)) {
    return { ok: false, error: 'File is not a JSON object' }
  }

  if (data.version !== PROJECT_VERSION) {
    return { ok: false, error: `Unsupported project version (expected ${PROJECT_VERSION})` }
  }

  if (typeof data.name !== 'string') {
    return { ok: false, error: 'Missing project name' }
  }

  if (!isRecord(data.composition)) {
    return { ok: false, error: 'Missing composition' }
  }

  const { width, height } = data.composition
  if (typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) {
    return { ok: false, error: 'Invalid composition size' }
  }

  if (!Array.isArray(data.slices)) {
    return { ok: false, error: 'Missing slices array' }
  }

  const slices: Slice[] = []
  for (const item of data.slices) {
    const slice = parseSlice(item)
    if (!slice) {
      return { ok: false, error: 'Invalid slice entry' }
    }
    slices.push(slice)
  }

  let strokeWidth = 3
  let frameBorderPx = DEFAULT_FRAME_BORDER_PX
  let design: SliceDesign = 'simple'
  let showDimensions = true
  let animation: AnimationSettings = { ...DEFAULT_ANIMATION }
  let video: VideoSettings = { ...DEFAULT_VIDEO }
  let guides: GuideSettings = { ...DEFAULT_GUIDES }
  if (isRecord(data.export)) {
    if (typeof data.export.strokeWidth === 'number') {
      if (data.export.strokeWidth > 0 && Number.isFinite(data.export.strokeWidth)) {
        strokeWidth = data.export.strokeWidth
      }
    }
    if (typeof data.export.frameBorderPx === 'number') {
      frameBorderPx = clampFrameBorderPx(data.export.frameBorderPx)
    }
    design = parseSliceDesign(data.export.design)
    if (typeof data.export.showDimensions === 'boolean') {
      showDimensions = data.export.showDimensions
    }
    animation = parseAnimation(data.export.animation)
    video = parseVideo(data.export.video)
    guides = parseGuides(data.export.guides)
  }

  return {
    ok: true,
    project: {
      version: 1,
      name: data.name,
      composition: {
        width: Math.round(width),
        height: Math.round(height),
      },
      slices,
      export: {
        strokeWidth,
        frameBorderPx,
        design,
        showDimensions,
        animation,
        video,
        guides,
      },
    },
  }
}

export function serializeProject(project: SliceMapProject): string {
  return `${JSON.stringify(project, null, 2)}\n`
}

export function downloadTextFile(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadProject(project: SliceMapProject): void {
  const safeName = project.name.trim().replace(/[^\w.-]+/g, '_') || 'slicemap'
  downloadTextFile(`${safeName}.slicemap.json`, serializeProject(project), 'application/json')
}

/** Round-trip helper used for verification. */
export function roundTripProject(project: SliceMapProject): SliceMapProject {
  const parsed = parseProject(JSON.parse(serializeProject(project)))
  if (!parsed.ok) {
    throw new Error(parsed.error)
  }
  return parsed.project
}
