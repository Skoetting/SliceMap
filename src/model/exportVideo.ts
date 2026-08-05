import { Muxer, ArrayBufferTarget } from 'mp4-muxer'
import { clampFps, clampPeriodSec, type SliceMapProject } from './types'
import { renderExportCanvas } from './exportPng'

export type VideoExportProgress = (current: number, total: number) => void

/** H.264 requires even dimensions. */
function evenSize(n: number): number {
  const v = Math.max(2, Math.round(n))
  return v % 2 === 0 ? v : v - 1
}

function pickAvcCodec(width: number, height: number): string {
  const pixels = width * height
  // Baseline/main levels that cover common LED wall comps
  if (pixels <= 1280 * 720) return 'avc1.42001f' // Baseline 3.1
  if (pixels <= 1920 * 1080) return 'avc1.4d0028' // Main 4.0
  return 'avc1.4d0034' // Main 5.2 (4K-ish)
}

function bitrateFor(width: number, height: number, fps: number): number {
  // Rough heuristic: ~0.15 bit per pixel per frame, clamped
  const raw = width * height * fps * 0.15
  return Math.min(40_000_000, Math.max(2_500_000, Math.round(raw)))
}

async function waitForEncoder(encoder: VideoEncoder): Promise<void> {
  while (encoder.encodeQueueSize > 4) {
    await new Promise<void>((resolve) => {
      encoder.ondequeue = () => resolve()
    })
  }
}

/**
 * Encode one seamless animation loop as H.264 MP4 (Resolume-native format).
 * Uses WebCodecs + mp4-muxer. Black plate (not PNG transparency).
 * Prefer Chrome/Edge; requires VideoEncoder H.264 support.
 */
export async function downloadVideo(
  project: SliceMapProject,
  onProgress?: VideoExportProgress,
): Promise<void> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    throw new Error(
      'This browser cannot encode MP4 (WebCodecs missing). Use Chrome or Edge to export video.',
    )
  }

  const fps = clampFps(project.export.video.fps)
  const periodSec = clampPeriodSec(project.export.animation.periodSec)
  const frameCount = Math.max(1, Math.round(fps * periodSec))
  const animate = project.export.animation.enabled

  const width = evenSize(project.composition.width)
  const height = evenSize(project.composition.height)
  const codec = pickAvcCodec(width, height)
  const bitrate = bitrateFor(width, height, fps)

  const support = await VideoEncoder.isConfigSupported({
    codec,
    width,
    height,
    bitrate,
    framerate: fps,
  })
  if (!support.supported) {
    throw new Error(
      'This browser cannot encode H.264 MP4 for this composition size. Use Chrome or Edge.',
    )
  }

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    video: {
      codec: 'avc',
      width,
      height,
    },
    fastStart: 'in-memory',
    firstTimestampBehavior: 'offset',
  })

  let encodeError: Error | null = null
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = e instanceof Error ? e : new Error(String(e))
    },
  })

  encoder.configure({
    codec,
    width,
    height,
    bitrate,
    framerate: fps,
    // Prefer hardware when available; software still fine for short loops
    latencyMode: 'quality',
  })

  // Draw into a fixed canvas (even dims) so VideoFrame size matches encoder config
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    encoder.close()
    throw new Error('Could not create canvas context')
  }

  const frameDurationUs = Math.round(1_000_000 / fps)

  try {
    for (let i = 0; i < frameCount; i++) {
      if (encodeError) throw encodeError

      const timeSec = i / fps
      const frameCanvas = renderExportCanvas(project, {
        background: 'black',
        animate,
        timeSec,
      })
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(frameCanvas, 0, 0, width, height)

      await waitForEncoder(encoder)

      const frame = new VideoFrame(canvas, {
        timestamp: i * frameDurationUs,
        duration: frameDurationUs,
      })
      // Keyframe periodically so Resolume seeking/loop stays reliable
      const keyFrame = i % Math.max(1, Math.round(fps)) === 0
      encoder.encode(frame, { keyFrame })
      frame.close()

      onProgress?.(i + 1, frameCount)
    }

    await encoder.flush()
    if (encodeError) throw encodeError
    muxer.finalize()
  } finally {
    try {
      encoder.close()
    } catch {
      // already closed
    }
  }

  const buffer = target.buffer
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Video encode produced an empty file.')
  }

  const blob = new Blob([buffer], { type: 'video/mp4' })
  const safeName = project.name.trim().replace(/[^\w.-]+/g, '_') || 'slicemap'
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}-test-pattern.mp4`
  a.click()
  URL.revokeObjectURL(url)
}
