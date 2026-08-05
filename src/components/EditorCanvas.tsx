import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  clampPositiveSize,
  normalizeRotation,
  pointInSlice,
  worldToLocal,
  type Point,
} from '../model/geometry'
import { drawSliceOnContext } from '../model/exportPng'
import {
  applyMoveSnap,
  SNAP_SCREEN_PX,
  type SnapGuide,
} from '../model/snap'
import type { Slice, SliceMapProject } from '../model/types'

type DragMode =
  | { kind: 'pan'; startClient: Point; originPan: Point }
  | { kind: 'move'; startWorld: Point; originCx: number; originCy: number }
  | {
      kind: 'resize'
      handle: 'nw' | 'ne' | 'se' | 'sw'
      origin: Pick<Slice, 'cx' | 'cy' | 'width' | 'height'>
    }
  | { kind: 'rotate'; startAngle: number; originRotation: number }

export type ZoomMode = 'fit' | number

export const ZOOM_MIN = 0.05
export const ZOOM_MAX = 4

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value))
}

interface EditorCanvasProps {
  project: SliceMapProject
  selectedId: string | null
  onSelect: (id: string | null) => void
  onUpdateSlice: (id: string, patch: Partial<Slice>) => void
  zoom: ZoomMode
  onZoomChange: (zoom: ZoomMode) => void
  onAddSlice?: () => void
  onImportAdvancedOutput?: () => void
}

const HANDLE = 8
const STAGE_PAD = 16

function canvasToWorld(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  compW: number,
  compH: number,
): Point {
  const rect = canvas.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * compW
  const y = ((clientY - rect.top) / rect.height) * compH
  return { x, y }
}

type HandleHit = 'nw' | 'ne' | 'se' | 'sw' | 'rotate'

function hitHandle(slice: Slice, world: Point, scale: number): HandleHit | null {
  const local = worldToLocal(slice, world)
  const hw = slice.width / 2
  const hh = slice.height / 2
  const threshold = HANDLE / scale

  const handles: Array<{ id: Exclude<HandleHit, 'rotate'>; x: number; y: number }> = [
    { id: 'nw', x: -hw, y: -hh },
    { id: 'ne', x: hw, y: -hh },
    { id: 'se', x: hw, y: hh },
    { id: 'sw', x: -hw, y: hh },
  ]

  for (const h of handles) {
    if (Math.hypot(local.x - h.x, local.y - h.y) <= threshold * 1.4) {
      return h.id
    }
  }

  const rotateY = -hh - 28 / scale
  if (Math.hypot(local.x - 0, local.y - rotateY) <= threshold * 1.6) {
    return 'rotate'
  }

  return null
}

function centeredPan(
  viewW: number,
  viewH: number,
  canvasW: number,
  canvasH: number,
): Point {
  return {
    x: (viewW - canvasW) / 2,
    y: (viewH - canvasH) / 2,
  }
}

export function EditorCanvas({
  project,
  selectedId,
  onSelect,
  onUpdateSlice,
  zoom,
  onZoomChange,
  onAddSlice,
  onImportAdvancedOutput,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewSize, setViewSize] = useState({ w: 800, h: 450 })
  const [pan, setPan] = useState<Point>({ x: STAGE_PAD, y: STAGE_PAD })
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)
  const dragRef = useRef<{ sliceId: string | null; mode: DragMode } | null>(null)
  const snapGuidesRef = useRef<SnapGuide[]>([])
  const projectRef = useRef(project)
  const onUpdateSliceRef = useRef(onUpdateSlice)
  projectRef.current = project
  onUpdateSliceRef.current = onUpdateSlice

  const { width: compW, height: compH } = project.composition
  const strokeWidth = project.export.strokeWidth
  const design = project.export.design
  const showDimensions = project.export.showDimensions
  const guideSettings = project.export.guides
  const animation = project.export.animation
  const animEnabled = animation.enabled
  const animTimeRef = useRef(0)

  const fitScale = useMemo(() => {
    const availW = Math.max(50, viewSize.w - STAGE_PAD * 2)
    const availH = Math.max(50, viewSize.h - STAGE_PAD * 2)
    return Math.min(availW / compW, availH / compH)
  }, [viewSize, compW, compH])

  const scale = zoom === 'fit' ? fitScale : zoom
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const panRef = useRef(pan)
  panRef.current = pan
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  const onZoomChangeRef = useRef(onZoomChange)
  onZoomChangeRef.current = onZoomChange
  const viewSizeRef = useRef(viewSize)
  viewSizeRef.current = viewSize
  const fitScaleRef = useRef(fitScale)
  fitScaleRef.current = fitScale

  const canvasCssW = Math.max(1, Math.round(compW * scale))
  const canvasCssH = Math.max(1, Math.round(compH * scale))

  const recenter = useCallback(() => {
    const { w, h } = viewSizeRef.current
    const s = zoomRef.current === 'fit' ? fitScaleRef.current : scaleRef.current
    const cssW = Math.max(1, Math.round(compW * s))
    const cssH = Math.max(1, Math.round(compH * s))
    setPan(centeredPan(w, h, cssW, cssH))
  }, [compW, compH])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setViewSize({ w: Math.max(100, width), h: Math.max(100, height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep Fit mode centered when the stage or composition size changes
  useEffect(() => {
    if (zoom !== 'fit') return
    setPan(centeredPan(viewSize.w, viewSize.h, canvasCssW, canvasCssH))
  }, [zoom, viewSize.w, viewSize.h, canvasCssW, canvasCssH])

  useEffect(() => {
    const isTypingTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false
      const tag = t.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return
      if (isTypingTarget(e.target)) return
      e.preventDefault()
      setSpaceDown(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      setSpaceDown(false)
    }
    const onBlur = () => setSpaceDown(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  // Ctrl/Cmd + scroll → zoom toward cursor; plain scroll → pan
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top

      if (e.ctrlKey || e.metaKey) {
        const current = scaleRef.current
        const intensity = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
        const factor = Math.exp(-intensity * 0.0015)
        const next = clampZoom(current * factor)
        const presets = [0.25, 0.5, 1]
        const snapped = presets.find((p) => Math.abs(p - next) < 0.012) ?? next

        const origin = panRef.current
        const worldX = (mx - origin.x) / current
        const worldY = (my - origin.y) / current
        setPan({
          x: mx - worldX * snapped,
          y: my - worldY * snapped,
        })
        onZoomChangeRef.current(snapped)
        return
      }

      // Trackpad / mouse wheel pans the composition in the viewport
      const dx = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaX
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      setPan((p) => ({ x: p.x - dx, y: p.y - dy }))
      if (zoomRef.current === 'fit') {
        onZoomChangeRef.current(scaleRef.current)
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = Math.max(1, Math.round(compW * scale))
    const cssH = Math.max(1, Math.round(compH * scale))
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)

    // Transparency plate in screen-pixel space so Fit/zoom never drops rows
    // from fractional composition-space cell sizes under the scale transform.
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const plateW = cssW
    const plateH = cssH
    const plateCell = 8
    ctx.fillStyle = '#0d1017'
    ctx.fillRect(0, 0, plateW, plateH)
    ctx.fillStyle = '#252b38'
    const plateCols = Math.ceil(plateW / plateCell)
    const plateRows = Math.ceil(plateH / plateCell)
    for (let row = 0; row < plateRows; row++) {
      for (let col = 0; col < plateCols; col++) {
        if ((row + col) % 2 !== 0) continue
        ctx.fillRect(col * plateCell, row * plateCell, plateCell, plateCell)
      }
    }
    ctx.restore()

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)

    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 1 / scale
    ctx.strokeRect(0.5 / scale, 0.5 / scale, compW - 1 / scale, compH - 1 / scale)

    project.slices.forEach((slice, sliceIndex) => {
      drawSliceOnContext(ctx, slice, strokeWidth, {
        showLabel: true,
        fillAlpha: slice.id === selectedId ? 0.38 : 0.26,
        design,
        showDimensions,
        guides: guideSettings,
        animation,
        timeSec: animTimeRef.current,
        sliceIndex,
      })
    })

    const selected = project.slices.find((s) => s.id === selectedId)
    if (selected) {
      ctx.save()
      ctx.translate(selected.cx, selected.cy)
      ctx.rotate((selected.rotationDeg * Math.PI) / 180)

      const hw = selected.width / 2
      const hh = selected.height / 2
      const hs = HANDLE / scale

      ctx.strokeStyle = '#F8FAFC'
      ctx.lineWidth = 1.5 / scale
      ctx.setLineDash([6 / scale, 4 / scale])
      ctx.strokeRect(-hw, -hh, selected.width, selected.height)
      ctx.setLineDash([])

      ctx.beginPath()
      ctx.moveTo(0, -hh)
      ctx.lineTo(0, -hh - 28 / scale)
      ctx.strokeStyle = '#F8FAFC'
      ctx.stroke()

      ctx.fillStyle = '#F8FAFC'
      ctx.beginPath()
      ctx.arc(0, -hh - 28 / scale, hs * 0.9, 0, Math.PI * 2)
      ctx.fill()

      const corners: Point[] = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh },
      ]
      for (const c of corners) {
        ctx.fillStyle = '#0F172A'
        ctx.strokeStyle = '#F8FAFC'
        ctx.lineWidth = 1.5 / scale
        ctx.beginPath()
        ctx.rect(c.x - hs / 2, c.y - hs / 2, hs, hs)
        ctx.fill()
        ctx.stroke()
      }

      ctx.restore()
    }

    const snapGuides = snapGuidesRef.current
    if (snapGuides.length > 0) {
      ctx.save()
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)'
      ctx.lineWidth = 1 / scale
      ctx.setLineDash([4 / scale, 4 / scale])
      for (const g of snapGuides) {
        ctx.beginPath()
        if (g.axis === 'x') {
          ctx.moveTo(g.value, 0)
          ctx.lineTo(g.value, compH)
        } else {
          ctx.moveTo(0, g.value)
          ctx.lineTo(compW, g.value)
        }
        ctx.stroke()
      }
      ctx.restore()
    }
  }, [
    project.slices,
    selectedId,
    compW,
    compH,
    scale,
    strokeWidth,
    design,
    showDimensions,
    guideSettings,
    animation,
  ])

  useEffect(() => {
    if (!animEnabled) {
      animTimeRef.current = 0
      draw()
      return
    }

    let raf = 0
    let lastTs: number | null = null
    const tick = (ts: number) => {
      if (lastTs == null) lastTs = ts
      const dt = (ts - lastTs) / 1000
      lastTs = ts
      const period = Math.max(0.5, animation.periodSec)
      animTimeRef.current = (animTimeRef.current + dt) % period
      draw()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [animEnabled, animation.periodSec, animation.style, draw])

  useEffect(() => {
    if (!animEnabled) draw()
  }, [draw, animEnabled])

  const pickTopSlice = (world: Point, slices: Slice[]): Slice | null => {
    for (let i = slices.length - 1; i >= 0; i--) {
      if (pointInSlice(slices[i], world)) {
        return slices[i]
      }
    }
    return null
  }

  const beginPan = (e: React.PointerEvent<HTMLElement>) => {
    dragRef.current = {
      sliceId: null,
      mode: {
        kind: 'pan',
        startClient: { x: e.clientX, y: e.clientY },
        originPan: { ...panRef.current },
      },
    }
    setPanning(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Middle mouse always pans; Space+drag pans from empty stage chrome
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault()
      beginPan(e)
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault()
      beginPan(e)
      return
    }
    if (e.button !== 0) return

    const world = canvasToWorld(canvas, e.clientX, e.clientY, compW, compH)
    const slices = projectRef.current.slices

    const selected = slices.find((s) => s.id === selectedId) ?? null
    if (selected) {
      const handle = hitHandle(selected, world, scale)
      if (handle === 'rotate') {
        const startAngle = Math.atan2(world.y - selected.cy, world.x - selected.cx)
        dragRef.current = {
          sliceId: selected.id,
          mode: {
            kind: 'rotate',
            startAngle,
            originRotation: selected.rotationDeg,
          },
        }
        canvas.setPointerCapture(e.pointerId)
        return
      }
      if (handle) {
        dragRef.current = {
          sliceId: selected.id,
          mode: {
            kind: 'resize',
            handle,
            origin: {
              cx: selected.cx,
              cy: selected.cy,
              width: selected.width,
              height: selected.height,
            },
          },
        }
        canvas.setPointerCapture(e.pointerId)
        return
      }
    }

    const hit = pickTopSlice(world, slices)
    onSelect(hit?.id ?? null)
    if (hit) {
      dragRef.current = {
        sliceId: hit.id,
        mode: {
          kind: 'move',
          startWorld: world,
          originCx: hit.cx,
          originCy: hit.cy,
        },
      }
      canvas.setPointerCapture(e.pointerId)
    } else {
      // Empty composition area — pan the view
      beginPan(e)
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag) return

    if (drag.mode.kind === 'pan') {
      const dx = e.clientX - drag.mode.startClient.x
      const dy = e.clientY - drag.mode.startClient.y
      setPan({
        x: drag.mode.originPan.x + dx,
        y: drag.mode.originPan.y + dy,
      })
      if (zoomRef.current === 'fit') {
        onZoomChangeRef.current(scaleRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas || !drag.sliceId) return
    const world = canvasToWorld(canvas, e.clientX, e.clientY, compW, compH)
    const slice = projectRef.current.slices.find((s) => s.id === drag.sliceId)
    if (!slice) return
    const update = onUpdateSliceRef.current

    if (drag.mode.kind === 'move') {
      const dx = world.x - drag.mode.startWorld.x
      const dy = world.y - drag.mode.startWorld.y
      const proposedCx = drag.mode.originCx + dx
      const proposedCy = drag.mode.originCy + dy

      if (e.altKey) {
        snapGuidesRef.current = []
        update(slice.id, { cx: proposedCx, cy: proposedCy })
        return
      }

      const others = projectRef.current.slices.filter((s) => s.id !== slice.id)
      const snapped = applyMoveSnap({
        moving: slice,
        others,
        composition: projectRef.current.composition,
        proposedCx,
        proposedCy,
        threshold: SNAP_SCREEN_PX / scale,
      })
      snapGuidesRef.current = snapped.guides
      update(slice.id, { cx: snapped.cx, cy: snapped.cy })
      return
    }

    if (drag.mode.kind === 'rotate') {
      const angle = Math.atan2(world.y - slice.cy, world.x - slice.cx)
      const deltaDeg = ((angle - drag.mode.startAngle) * 180) / Math.PI
      update(slice.id, {
        rotationDeg: normalizeRotation(drag.mode.originRotation + deltaDeg),
      })
      return
    }

    if (drag.mode.kind === 'resize') {
      const local = worldToLocal(
        {
          ...slice,
          cx: drag.mode.origin.cx,
          cy: drag.mode.origin.cy,
          rotationDeg: slice.rotationDeg,
        },
        world,
      )
      const o = drag.mode.origin
      const hw = o.width / 2
      const hh = o.height / 2

      let left = -hw
      let right = hw
      let top = -hh
      let bottom = hh

      const h = drag.mode.handle
      if (h.includes('w')) left = Math.min(local.x, right - 1)
      if (h.includes('e')) right = Math.max(local.x, left + 1)
      if (h.includes('n')) top = Math.min(local.y, bottom - 1)
      if (h.includes('s')) bottom = Math.max(local.y, top + 1)

      const width = clampPositiveSize(right - left)
      const height = clampPositiveSize(bottom - top)
      const localCx = (left + right) / 2
      const localCy = (top + bottom) / 2

      const rad = (slice.rotationDeg * Math.PI) / 180
      const cos = Math.cos(rad)
      const sin = Math.sin(rad)
      const worldCx = drag.mode.origin.cx + localCx * cos - localCy * sin
      const worldCy = drag.mode.origin.cy + localCx * sin + localCy * cos

      update(slice.id, {
        cx: worldCx,
        cy: worldCy,
        width,
        height,
      })
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const wasPan = dragRef.current?.mode.kind === 'pan'
    dragRef.current = null
    if (wasPan) setPanning(false)
    if (snapGuidesRef.current.length > 0) {
      snapGuidesRef.current = []
      draw()
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const setZoomMode = (mode: ZoomMode) => {
    onZoomChange(mode)
    if (mode === 'fit') {
      // Effect recenters; also do it immediately for snappy UI
      const s = fitScaleRef.current
      const cssW = Math.max(1, Math.round(compW * s))
      const cssH = Math.max(1, Math.round(compH * s))
      setPan(centeredPan(viewSize.w, viewSize.h, cssW, cssH))
      return
    }
    // Numeric presets: keep current pan unless coming from a tiny/huge jump — recenter
    const cssW = Math.max(1, Math.round(compW * mode))
    const cssH = Math.max(1, Math.round(compH * mode))
    setPan(centeredPan(viewSize.w, viewSize.h, cssW, cssH))
  }

  const viewPct = Math.round(scale * 100)
  const zoomPresets = [
    ['fit', 'Fit'],
    [0.25, '25%'],
    [0.5, '50%'],
    [1, '100%'],
  ] as const

  const isPresetActive = (mode: 'fit' | 0.25 | 0.5 | 1): boolean => {
    if (mode === 'fit') return zoom === 'fit'
    return typeof zoom === 'number' && Math.abs(zoom - mode) < 0.012
  }

  const cursor =
    panning || spaceDown ? (panning ? 'grabbing' : 'grab') : undefined

  return (
    <div className="canvas-panel">
      <div className="canvas-toolbar">
        <span className="canvas-meta">
          {compW}×{compH}px · view {viewPct}%
          <span className="canvas-meta-hint">
            {' '}
            · Ctrl/⌘+scroll zoom · scroll/Space/middle/empty-drag pan
          </span>
        </span>
        <div className="zoom-group" role="group" aria-label="Zoom">
          {zoomPresets.map(([mode, label]) => (
            <button
              key={label}
              type="button"
              className={isPresetActive(mode) ? 'btn btn-small active' : 'btn btn-small'}
              onClick={() => setZoomMode(mode)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-small"
            onClick={recenter}
            title="Center composition in the preview"
          >
            Center
          </button>
        </div>
      </div>
      <div
        className="canvas-stage"
        ref={containerRef}
        style={{ cursor: cursor ?? 'default' }}
        onPointerDown={onStagePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => {
          // Avoid browser menu when middle-click / pan gestures misfire
          if (spaceDown) e.preventDefault()
        }}
      >
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            cursor: cursor ?? 'crosshair',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {project.slices.length === 0 && (onAddSlice || onImportAdvancedOutput) && (
          <div className="canvas-empty" role="status">
            <p className="canvas-empty-title">No slices yet</p>
            <p className="canvas-empty-body">
              Add a slice to start mapping, or import an existing Resolume Advanced Output
              screen setup.
            </p>
            <div className="canvas-empty-actions">
              {onAddSlice && (
                <button type="button" className="btn btn-primary" onClick={onAddSlice}>
                  Add slice
                </button>
              )}
              {onImportAdvancedOutput && (
                <button type="button" className="btn" onClick={onImportAdvancedOutput}>
                  Import Advanced Output
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
