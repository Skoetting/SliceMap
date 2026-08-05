import {
  applySliceTransform,
  clampPositiveSize,
} from './geometry'
import {
  sliceAnimPhase,
  type AnimationSettings,
  type AnimationStyle,
  type GuideSettings,
  type Slice,
  type SliceDesign,
  type SliceMapProject,
} from './types'

function withAlpha(hex: string, alpha: number): string {
  const raw = hex.replace('#', '')
  if (raw.length !== 6) return `rgba(59, 130, 246, ${alpha})`
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function caroCellSize(w: number, h: number): number {
  const short = Math.min(w, h)
  const targetCells = 12
  const raw = short / targetCells
  return Math.max(8, Math.min(64, raw))
}

/** Pulse multiplier in (0.35, 1] — at phase 0 equals 1 (static look). */
function pulseFactor(phase: number): number {
  return 0.35 + 0.65 * (0.5 + 0.5 * Math.cos(phase * Math.PI * 2))
}

function drawCaro(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  scrollPhase: number,
  alphaScale: number,
): void {
  const cell = caroCellSize(w, h)
  const left = -w / 2
  const top = -h / 2
  const offset = scrollPhase * cell * 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(left, top, w, h)
  ctx.clip()

  const cols = Math.ceil(w / cell) + 3
  const rows = Math.ceil(h / cell) + 3
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const odd = (row + col) % 2 === 0
      const base = odd ? 0.42 : 0.12
      ctx.fillStyle = withAlpha(color, base * alphaScale)
      ctx.fillRect(
        left + col * cell + offset,
        top + row * cell + offset,
        cell + 0.5,
        cell + 0.5,
      )
    }
  }
  ctx.restore()
}

function drawCrossFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  strokeWidth: number,
  alphaScale: number,
): void {
  const left = -w / 2
  const top = -h / 2
  ctx.fillStyle = withAlpha(color, 0.12 * alphaScale)
  ctx.fillRect(left, top, w, h)

  const thickness = Math.max(strokeWidth, Math.min(w, h) * 0.02, 2)
  ctx.fillStyle = withAlpha(color, 0.85 * alphaScale)
  ctx.fillRect(-thickness / 2, top, thickness, h)
  ctx.fillRect(left, -thickness / 2, w, thickness)
}

function drawSimpleFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  fillAlpha: number,
): void {
  ctx.fillStyle = withAlpha(color, fillAlpha)
  ctx.fillRect(-w / 2, -h / 2, w, h)
}

function resolveMotion(
  design: SliceDesign,
  style: AnimationStyle,
  phase: number,
): { scrollPhase: number; alphaScale: number } {
  if (style === 'pulse') {
    return { scrollPhase: 0, alphaScale: pulseFactor(phase) }
  }
  if (design === 'caro') {
    return { scrollPhase: phase, alphaScale: 1 }
  }
  return { scrollPhase: 0, alphaScale: pulseFactor(phase) }
}

function circleRadius(w: number, h: number, strokeWidth: number): number {
  const short = Math.min(w, h)
  const inset = Math.max(strokeWidth + 2, short * 0.04)
  return Math.max(4, short / 2 - inset)
}

function dashPattern(size: number): number[] {
  const dash = Math.max(6, Math.min(28, size * 0.06))
  const gap = Math.max(4, dash * 0.7)
  return [dash, gap]
}

function drawGuideCross(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  strokeWidth: number,
  opts: {
    animating: boolean
    style: AnimationStyle
    phase: number
  },
): void {
  const left = -w / 2
  const top = -h / 2
  const lw = Math.max(1.5, strokeWidth * 0.85)
  let alpha = 0.95
  let width = lw

  ctx.save()
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = width
  ctx.lineCap = 'butt'

  if (opts.animating && opts.style === 'pulse') {
    const p = pulseFactor(opts.phase)
    alpha = 0.45 + 0.55 * p
    width = lw * (0.75 + 0.35 * p)
    ctx.strokeStyle = withAlpha(color, alpha)
    ctx.lineWidth = width
    ctx.setLineDash([])
  } else if (opts.animating && opts.style === 'phase-scroll') {
    const short = Math.min(w, h)
    const dash = dashPattern(short)
    const peri = dash[0] + dash[1]
    ctx.setLineDash(dash)
    ctx.lineDashOffset = -opts.phase * peri * 4
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.moveTo(0, top)
  ctx.lineTo(0, -top)
  ctx.moveTo(left, 0)
  ctx.lineTo(-left, 0)
  ctx.stroke()
  ctx.restore()
}

function drawGuideCircle(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  strokeWidth: number,
  opts: {
    animating: boolean
    style: AnimationStyle
    phase: number
  },
): void {
  const baseR = circleRadius(w, h, strokeWidth)
  let r = baseR
  const lw = Math.max(1.5, strokeWidth * 0.85)
  let alpha = 0.95

  if (opts.animating && opts.style === 'pulse') {
    const p = pulseFactor(opts.phase)
    r = baseR * (0.94 + 0.06 * p)
    alpha = 0.5 + 0.5 * p
  }

  ctx.save()
  ctx.strokeStyle = withAlpha(color, alpha)
  ctx.lineWidth = lw
  ctx.lineCap = 'butt'

  if (opts.animating && opts.style === 'phase-scroll') {
    const dash = dashPattern(Math.min(w, h))
    const peri = dash[0] + dash[1]
    ctx.setLineDash(dash)
    ctx.lineDashOffset = -opts.phase * peri * 6
  } else {
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  strokeWidth: number,
  guidesEnabled: boolean,
): void {
  const left = -w / 2
  const top = -h / 2
  const lw = Math.max(1, strokeWidth)

  ctx.save()
  ctx.setLineDash([])
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.rect(left, top, w, h)
  ctx.stroke()

  if (guidesEnabled) {
    const inset = Math.max(lw + 1, 3)
    ctx.strokeStyle = withAlpha(color, 0.4)
    ctx.lineWidth = Math.max(1, lw * 0.45)
    ctx.beginPath()
    ctx.rect(left + inset, top + inset, w - inset * 2, h - inset * 2)
    ctx.stroke()
  }
  ctx.restore()
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  slice: Slice,
  w: number,
  h: number,
  showDimensions: boolean,
  showLabelPlate: boolean,
): void {
  const label = `${slice.name}`
  const fontSize = Math.max(10, Math.min(28, Math.min(w, h) / 8))
  const nameFont = `600 ${fontSize}px "IBM Plex Sans", system-ui, sans-serif`
  const dimFont = `500 ${fontSize * 0.85}px "IBM Plex Sans", system-ui, sans-serif`

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = nameFont
  const nameWidth = ctx.measureText(label).width

  let dimWidth = 0
  let blockTop = 0
  let blockBottom = 0
  if (showDimensions) {
    const sizeLabel = `${Math.round(w)}×${Math.round(h)}`
    ctx.font = dimFont
    dimWidth = ctx.measureText(sizeLabel).width
    blockTop = -fontSize * 0.35 - fontSize * 0.55
    blockBottom = fontSize * 0.75 + fontSize * 0.45
  } else {
    blockTop = -fontSize * 0.55
    blockBottom = fontSize * 0.55
  }

  const textW = Math.max(nameWidth, dimWidth)
  const padX = Math.max(6, fontSize * 0.45)
  const padY = Math.max(4, fontSize * 0.25)

  if (showLabelPlate) {
    const plateW = textW + padX * 2
    const plateH = blockBottom - blockTop + padY * 2
    const x = -plateW / 2
    const y = blockTop - padY
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.strokeStyle = withAlpha(slice.color, 0.85)
    ctx.lineWidth = Math.max(1, fontSize / 12)
    ctx.beginPath()
    const r = Math.min(4, fontSize * 0.2)
    // sharp-ish rounded rect
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + plateW - r, y)
    ctx.quadraticCurveTo(x + plateW, y, x + plateW, y + r)
    ctx.lineTo(x + plateW, y + plateH - r)
    ctx.quadraticCurveTo(x + plateW, y + plateH, x + plateW - r, y + plateH)
    ctx.lineTo(x + r, y + plateH)
    ctx.quadraticCurveTo(x, y + plateH, x, y + plateH - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.lineWidth = Math.max(2, fontSize / 8)
  ctx.font = nameFont

  if (showDimensions) {
    const sizeLabel = `${Math.round(w)}×${Math.round(h)}`
    const y0 = -fontSize * 0.35
    const y1 = fontSize * 0.75
    ctx.strokeText(label, 0, y0)
    ctx.fillText(label, 0, y0)
    ctx.font = dimFont
    ctx.strokeText(sizeLabel, 0, y1)
    ctx.fillText(sizeLabel, 0, y1)
  } else {
    ctx.strokeText(label, 0, 0)
    ctx.fillText(label, 0, 0)
  }
}

export interface DrawSliceOptions {
  showLabel: boolean
  fillAlpha?: number
  design?: SliceDesign
  showDimensions?: boolean
  guides?: GuideSettings
  /** When set with animation enabled, fill/pattern and guides are time-modulated. */
  animation?: AnimationSettings
  timeSec?: number
  sliceIndex?: number
}

export function drawSliceOnContext(
  ctx: CanvasRenderingContext2D,
  slice: Slice,
  strokeWidth: number,
  options: DrawSliceOptions,
): void {
  const fillAlpha = options.fillAlpha ?? 0.28
  const design = options.design ?? 'simple'
  const showDimensions = options.showDimensions ?? true
  const guides = options.guides
  const guidesEnabled = guides?.enabled ?? false
  const w = clampPositiveSize(slice.width)
  const h = clampPositiveSize(slice.height)

  let scrollPhase = 0
  let alphaScale = 1
  let phase = 0
  const anim = options.animation
  const animating = Boolean(anim?.enabled)
  if (animating && anim) {
    phase = sliceAnimPhase(
      options.timeSec ?? 0,
      anim.periodSec,
      options.sliceIndex ?? 0,
    )
    const motion = resolveMotion(design, anim.style, phase)
    scrollPhase = motion.scrollPhase
    alphaScale = motion.alphaScale
  }

  ctx.save()
  applySliceTransform(ctx, slice)

  // 1) Fill design
  if (design === 'caro') {
    drawCaro(ctx, w, h, slice.color, scrollPhase, alphaScale)
  } else if (design === 'cross') {
    drawCrossFill(ctx, w, h, slice.color, strokeWidth, alphaScale)
  } else {
    drawSimpleFill(ctx, w, h, slice.color, fillAlpha * alphaScale)
  }

  // 2) Geometry guides (above fill)
  const guideAnim = {
    animating,
    style: (anim?.style ?? 'phase-scroll') as AnimationStyle,
    phase,
  }
  if (guidesEnabled && guides?.showCross && design !== 'cross') {
    drawGuideCross(ctx, w, h, slice.color, strokeWidth, guideAnim)
  }
  if (guidesEnabled && guides?.showCircle) {
    drawGuideCircle(ctx, w, h, slice.color, strokeWidth, guideAnim)
  }

  // 3) Frame
  drawFrame(ctx, w, h, slice.color, strokeWidth, guidesEnabled)

  // 4) Label (+ plate)
  if (options.showLabel) {
    const showPlate = guidesEnabled && (guides?.showLabelPlate ?? true)
    drawLabel(ctx, slice, w, h, showDimensions, showPlate)
  }

  ctx.restore()
}

export interface RenderCanvasOptions {
  /** Opaque black plate for video; transparent clear for PNG. */
  background?: 'transparent' | 'black'
  timeSec?: number
  /** Force animation on/off for this render (defaults to project setting). */
  animate?: boolean
}

export function renderExportCanvas(
  project: SliceMapProject,
  options: RenderCanvasOptions = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = project.composition.width
  canvas.height = project.composition.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not create canvas context')
  }

  const background = options.background ?? 'transparent'
  if (background === 'black') {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const animate =
    options.animate ?? project.export.animation.enabled
  const animation: AnimationSettings = {
    ...project.export.animation,
    enabled: animate,
  }

  project.slices.forEach((slice, sliceIndex) => {
    drawSliceOnContext(ctx, slice, project.export.strokeWidth, {
      showLabel: true,
      fillAlpha: 0.22,
      design: project.export.design,
      showDimensions: project.export.showDimensions,
      guides: project.export.guides,
      animation,
      timeSec: options.timeSec ?? 0,
      sliceIndex,
    })
  })

  return canvas
}

export function downloadPng(project: SliceMapProject): void {
  const canvas = renderExportCanvas(project, {
    background: 'transparent',
    animate: false,
    timeSec: 0,
  })
  const safeName = project.name.trim().replace(/[^\w.-]+/g, '_') || 'slicemap'
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeName}-input-map.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
