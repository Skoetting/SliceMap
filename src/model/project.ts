import {
  DEFAULT_ANIMATION,
  DEFAULT_COLORS,
  DEFAULT_FRAME_BORDER_PX,
  DEFAULT_GUIDES,
  DEFAULT_VIDEO,
  type Slice,
  type SliceMapProject,
} from './types'

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `slice-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function createDefaultProject(): SliceMapProject {
  return {
    version: 1,
    name: 'untitled',
    composition: { width: 1920, height: 1080 },
    slices: [],
    export: {
      strokeWidth: 3,
      frameBorderPx: DEFAULT_FRAME_BORDER_PX,
      design: 'simple',
      showDimensions: true,
      animation: { ...DEFAULT_ANIMATION },
      video: { ...DEFAULT_VIDEO },
      guides: { ...DEFAULT_GUIDES },
    },
  }
}

export function createSlice(
  composition: { width: number; height: number },
  existingCount: number,
  partial?: Partial<Omit<Slice, 'id'>>,
): Slice {
  const color = DEFAULT_COLORS[existingCount % DEFAULT_COLORS.length]
  const width = Math.min(400, Math.round(composition.width / 4))
  const height = Math.min(300, Math.round(composition.height / 4))

  return {
    id: createId(),
    name: `Slice ${existingCount + 1}`,
    cx: Math.round(composition.width / 2),
    cy: Math.round(composition.height / 2),
    width,
    height,
    rotationDeg: 0,
    color,
    ...partial,
  }
}

export function duplicateSlice(slice: Slice): Slice {
  return {
    ...slice,
    id: createId(),
    name: `${slice.name} copy`,
    cx: slice.cx + 24,
    cy: slice.cy + 24,
  }
}

export function clampCompositionSize(width: number, height: number): {
  width: number
  height: number
} | null {
  if (!Number.isFinite(width) || !Number.isFinite(height)) return null
  if (width <= 0 || height <= 0) return null
  return {
    width: Math.round(width),
    height: Math.round(height),
  }
}
