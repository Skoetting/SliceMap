import { applySliceTransform, clampPositiveSize } from './geometry'
import { clampFrameBorderPx, type Slice, type SliceMapProject } from './types'

/** Composition-sized PNG with every slice border drawn in place. */
export const COMPOSITE_FRAME_FILENAME = 'frames-all.png'

export interface FrameFile {
  filename: string
  blob: Blob
  width: number
  height: number
  borderPx: number
  clamped: boolean
}

export interface ExportFramesResult {
  files: FrameFile[]
  /** True when more than one file was packed into a zip. */
  zipped: boolean
  clampCount: number
}

/** Border fully inside bounds; leave ≥1px hollow when the slice is large enough. */
export function effectiveFrameBorder(
  width: number,
  height: number,
  requested: number,
): { border: number; clamped: boolean } {
  const req = clampFrameBorderPx(requested)
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  const short = Math.min(w, h)
  const maxBorder = short <= 2 ? short : Math.floor((short - 1) / 2)
  const border = Math.min(req, Math.max(1, maxBorder))
  return { border, clamped: border < req }
}

export function sanitizeFrameBaseName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'slice'
}

/** Unique `frame-<name>.png` filenames for a slice list. */
export function uniqueFrameFilenames(slices: Pick<Slice, 'name'>[]): string[] {
  const used = new Map<string, number>()
  return slices.map((slice) => {
    const base = sanitizeFrameBaseName(slice.name)
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    const stem = count === 0 ? base : `${base}-${count + 1}`
    return `frame-${stem}.png`
  })
}

/** Hollow white frame in top-left pixel space (per-slice PNG). */
function renderFrameCanvas(
  width: number,
  height: number,
  border: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context')

  ctx.clearRect(0, 0, width, height)
  fillHollowRect(ctx, 0, 0, width, height, border)
  return canvas
}

function fillHollowRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  border: number,
): void {
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  const innerW = width - border * 2
  const innerH = height - border * 2
  if (innerW > 0 && innerH > 0) {
    ctx.rect(x + border, y + border, innerW, innerH)
  }
  ctx.fill('evenodd')
}

/** Draw one hollow frame in slice local space (origin at slice center). */
function drawHollowFrameLocal(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  border: number,
): void {
  fillHollowRect(ctx, -width / 2, -height / 2, width, height, border)
}

/**
 * Composition-sized transparent PNG with all slice borders at their
 * position / rotation (same geometry as the editor).
 */
export function renderCompositeFramesCanvas(
  project: SliceMapProject,
  requestedBorder: number,
): { canvas: HTMLCanvasElement; clampCount: number } {
  const canvas = document.createElement('canvas')
  canvas.width = project.composition.width
  canvas.height = project.composition.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create canvas context')

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  let clampCount = 0
  for (const slice of project.slices) {
    const width = clampPositiveSize(Math.round(slice.width))
    const height = clampPositiveSize(Math.round(slice.height))
    const { border, clamped } = effectiveFrameBorder(
      width,
      height,
      requestedBorder,
    )
    if (clamped) clampCount += 1

    ctx.save()
    applySliceTransform(ctx, slice)
    drawHollowFrameLocal(ctx, width, height, border)
    ctx.restore()
  }

  return { canvas, clampCount }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Failed to encode frame PNG'))
      else resolve(blob)
    }, 'image/png')
  })
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/* --- Minimal ZIP (STORE, no compression) --- */

function crc32(data: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    c ^= data[i]
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1
    }
  }
  return (c ^ 0xffffffff) >>> 0
}

function u16(n: number): Uint8Array {
  const b = new Uint8Array(2)
  b[0] = n & 0xff
  b[1] = (n >>> 8) & 0xff
  return b
}

function u32(n: number): Uint8Array {
  const b = new Uint8Array(4)
  b[0] = n & 0xff
  b[1] = (n >>> 8) & 0xff
  b[2] = (n >>> 16) & 0xff
  b[3] = (n >>> 24) & 0xff
  return b
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let len = 0
  for (const p of parts) len += p.length
  const out = new Uint8Array(len)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer
}

export function buildZipStore(files: { name: string; data: Uint8Array }[]): Blob {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name)
    const crc = crc32(file.data)
    const size = file.data.length

    const localHeader = concatBytes([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      nameBytes,
      file.data,
    ])
    localParts.push(localHeader)

    const central = concatBytes([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBytes,
    ])
    centralParts.push(central)
    offset += localHeader.length
  }

  const centralDir = concatBytes(centralParts)
  const end = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),
    u16(0),
  ])

  return new Blob([toArrayBuffer(concatBytes([...localParts, centralDir, end]))], {
    type: 'application/zip',
  })
}

/**
 * Build per-slice hollow frame PNGs plus one composition-sized composite.
 * Throws if there are no slices. Does not trigger download — use {@link downloadFrames}.
 */
export async function buildSliceFrames(
  project: SliceMapProject,
): Promise<{ files: FrameFile[]; clampCount: number }> {
  if (project.slices.length === 0) {
    throw new Error('Add at least one slice before exporting frames.')
  }

  const requested = clampFrameBorderPx(project.export.frameBorderPx)
  const filenames = uniqueFrameFilenames(project.slices)
  const files: FrameFile[] = []
  let clampCount = 0

  for (let i = 0; i < project.slices.length; i++) {
    const slice = project.slices[i]
    const width = Math.max(1, Math.round(slice.width))
    const height = Math.max(1, Math.round(slice.height))
    const { border, clamped } = effectiveFrameBorder(width, height, requested)
    if (clamped) clampCount += 1
    const canvas = renderFrameCanvas(width, height, border)
    const blob = await canvasToPngBlob(canvas)
    files.push({
      filename: filenames[i],
      blob,
      width,
      height,
      borderPx: border,
      clamped,
    })
  }

  const { canvas: compositeCanvas } = renderCompositeFramesCanvas(
    project,
    requested,
  )
  const compositeBlob = await canvasToPngBlob(compositeCanvas)
  files.push({
    filename: COMPOSITE_FRAME_FILENAME,
    blob: compositeBlob,
    width: project.composition.width,
    height: project.composition.height,
    borderPx: requested,
    clamped: clampCount > 0,
  })

  return { files, clampCount }
}

export async function downloadFrames(
  project: SliceMapProject,
): Promise<ExportFramesResult> {
  const { files, clampCount } = await buildSliceFrames(project)
  const safeProject =
    project.name.trim().replace(/[^\w.-]+/g, '_') || 'slicemap'

  // Always zip: per-slice PNG(s) + composition composite.
  const zipEntries = await Promise.all(
    files.map(async (file) => ({
      name: file.filename,
      data: new Uint8Array(await file.blob.arrayBuffer()),
    })),
  )
  const zip = buildZipStore(zipEntries)
  downloadBlob(`${safeProject}-frames.zip`, zip)
  return { files, zipped: true, clampCount }
}
