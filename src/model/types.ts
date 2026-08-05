export interface Composition {
  width: number
  height: number
}

export interface Slice {
  id: string
  name: string
  cx: number
  cy: number
  width: number
  height: number
  rotationDeg: number
  color: string
}

export type SliceDesign = 'simple' | 'caro' | 'cross'

export const SLICE_DESIGNS = ['simple', 'caro', 'cross'] as const

export type AnimationStyle = 'phase-scroll' | 'pulse'

export const ANIMATION_STYLES = ['phase-scroll', 'pulse'] as const

export interface AnimationSettings {
  enabled: boolean
  style: AnimationStyle
  /** Length of one seamless loop in seconds. */
  periodSec: number
}

export interface VideoSettings {
  /** Frames per second for video export (clamped 15–60). */
  fps: number
}

export interface GuideSettings {
  /** Master toggle for RasterVideo-style geometry overlays. */
  enabled: boolean
  showCross: boolean
  showCircle: boolean
  showLabelPlate: boolean
}

export interface ExportSettings {
  strokeWidth: number
  /** Border thickness (px) for per-slice hollow frame PNG export. */
  frameBorderPx: number
  /** Composition-wide fill pattern applied to every slice. */
  design: SliceDesign
  /** When true, on-slice labels include width×height. */
  showDimensions: boolean
  animation: AnimationSettings
  video: VideoSettings
  guides: GuideSettings
}

export interface SliceMapProject {
  version: 1
  name: string
  composition: Composition
  slices: Slice[]
  export: ExportSettings
}

export const PROJECT_VERSION = 1 as const

export const DEFAULT_ANIMATION: AnimationSettings = {
  enabled: false,
  style: 'phase-scroll',
  periodSec: 4,
}

export const DEFAULT_VIDEO: VideoSettings = {
  fps: 30,
}

export const DEFAULT_GUIDES: GuideSettings = {
  enabled: true,
  showCross: true,
  showCircle: true,
  showLabelPlate: true,
}

/** Default hollow-frame border for Radar-style outline media. */
export const DEFAULT_FRAME_BORDER_PX = 12

export function clampFrameBorderPx(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_FRAME_BORDER_PX
  return Math.min(512, Math.max(1, Math.round(value)))
}

export const DEFAULT_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#F59E0B',
  '#EF4444',
  '#A855F7',
  '#06B6D4',
  '#F97316',
  '#EC4899',
] as const

export function clampPeriodSec(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_ANIMATION.periodSec
  return Math.min(60, Math.max(0.5, value))
}

export function clampFps(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_VIDEO.fps
  return Math.min(60, Math.max(15, Math.round(value)))
}

/** Normalized phase in [0, 1) with per-slice offset (index * 0.15 of period). */
export function sliceAnimPhase(
  timeSec: number,
  periodSec: number,
  sliceIndex: number,
): number {
  const period = clampPeriodSec(periodSec)
  const offset = ((sliceIndex * 0.15) % 1 + 1) % 1
  const raw = timeSec / period + offset
  return ((raw % 1) + 1) % 1
}
