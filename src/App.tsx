import { useEffect, useMemo, useRef, useState } from 'react'
import { EditorCanvas, type ZoomMode } from './components/EditorCanvas'
import { downloadFrames } from './model/exportFrames'
import { downloadPng } from './model/exportPng'
import { downloadVideo } from './model/exportVideo'
import { findOverlappingPairs } from './model/overlap'
import {
  clampCompositionSize,
  createDefaultProject,
  createSlice,
  duplicateSlice,
} from './model/project'
import {
  parseResolumeScreenSetupXml,
  ResolumeXmlImportError,
} from './model/importResolumeXml'
import {
  downloadProject,
  parseProject,
} from './model/persistence'
import {
  centerFromOffset,
  clampPositiveSize,
  normalizeRotation,
  sliceOffset,
} from './model/geometry'
import {
  clampFps,
  clampFrameBorderPx,
  clampPeriodSec,
  type AnimationStyle,
  type Slice,
  type SliceDesign,
  type SliceMapProject,
} from './model/types'

type GeomDraft = {
  offsetX: string
  offsetY: string
  width: string
  height: string
  rotationDeg: string
}

function geomDraftFromSlice(slice: Slice): GeomDraft {
  const { offsetX, offsetY } = sliceOffset(slice)
  return {
    offsetX: String(roundNice(offsetX)),
    offsetY: String(roundNice(offsetY)),
    width: String(roundNice(slice.width)),
    height: String(roundNice(slice.height)),
    rotationDeg: String(roundNice(slice.rotationDeg)),
  }
}

function roundNice(n: number): number {
  return Math.round(n * 100) / 100
}

export default function App() {
  const [project, setProject] = useState<SliceMapProject>(() => createDefaultProject())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [zoom, setZoom] = useState<ZoomMode>('fit')
  const [exportingVideo, setExportingVideo] = useState(false)
  const [framesMenuOpen, setFramesMenuOpen] = useState(false)
  const [compDraft, setCompDraft] = useState({
    width: String(1920),
    height: String(1080),
  })
  const [geomDraft, setGeomDraft] = useState<GeomDraft | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const xmlInputRef = useRef<HTMLInputElement>(null)
  const framesMenuRef = useRef<HTMLDivElement>(null)

  const selected = project.slices.find((s) => s.id === selectedId) ?? null

  // Keep inspector drafts in sync when selection changes or canvas edits geometry
  useEffect(() => {
    if (!selected) {
      setGeomDraft(null)
      return
    }
    setGeomDraft(geomDraftFromSlice(selected))
  }, [
    selected?.id,
    selected?.cx,
    selected?.cy,
    selected?.width,
    selected?.height,
    selected?.rotationDeg,
  ])

  useEffect(() => {
    if (!framesMenuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      const el = framesMenuRef.current
      if (el && !el.contains(e.target as Node)) {
        setFramesMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFramesMenuOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [framesMenuOpen])

  const overlaps = useMemo(
    () => findOverlappingPairs(project.slices),
    [project.slices],
  )

  const updateProject = (updater: (prev: SliceMapProject) => SliceMapProject) => {
    setProject(updater)
  }

  const applyComposition = () => {
    const next = clampCompositionSize(Number(compDraft.width), Number(compDraft.height))
    if (!next) {
      setStatus('Composition size must be positive numbers.')
      setCompDraft({
        width: String(project.composition.width),
        height: String(project.composition.height),
      })
      return
    }
    updateProject((p) => ({ ...p, composition: next }))
    setCompDraft({ width: String(next.width), height: String(next.height) })
    setStatus(`Composition set to ${next.width}×${next.height}px`)
  }

  const addSlice = () => {
    updateProject((p) => {
      const slice = createSlice(p.composition, p.slices.length)
      setSelectedId(slice.id)
      return { ...p, slices: [...p.slices, slice] }
    })
  }

  const updateSlice = (id: string, patch: Partial<Slice>) => {
    updateProject((p) => ({
      ...p,
      slices: p.slices.map((s) => {
        if (s.id !== id) return s
        const next = { ...s, ...patch }
        if (patch.width !== undefined) next.width = clampPositiveSize(patch.width)
        if (patch.height !== undefined) next.height = clampPositiveSize(patch.height)
        if (patch.rotationDeg !== undefined) {
          next.rotationDeg = normalizeRotation(patch.rotationDeg)
        }
        return next
      }),
    }))
  }

  const commitGeomField = (
    field: keyof GeomDraft,
    parse: (raw: string) => number | null,
  ) => {
    if (!selected || !geomDraft) return
    const parsed = parse(geomDraft[field])
    if (parsed === null) {
      setGeomDraft(geomDraftFromSlice(selected))
      setStatus(`Invalid ${field}`)
      return
    }
    if (field === 'offsetX' || field === 'offsetY') {
      const current = sliceOffset(selected)
      const offsetX = field === 'offsetX' ? parsed : current.offsetX
      const offsetY = field === 'offsetY' ? parsed : current.offsetY
      updateSlice(selected.id, centerFromOffset(offsetX, offsetY, selected.width, selected.height))
      return
    }
    updateSlice(selected.id, { [field]: parsed } as Partial<Slice>)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    updateProject((p) => ({
      ...p,
      slices: p.slices.filter((s) => s.id !== selectedId),
    }))
    setSelectedId(null)
  }

  const duplicateSelected = () => {
    if (!selected) return
    const copy = duplicateSlice(selected)
    updateProject((p) => ({ ...p, slices: [...p.slices, copy] }))
    setSelectedId(copy.id)
  }

  const onExportPng = () => {
    if (project.slices.length === 0) {
      const proceed = window.confirm(
        'No slices yet. Export a blank transparent PNG at composition size anyway?',
      )
      if (!proceed) return
    }
    downloadPng(project)
    setStatus(
      `Exported ${project.composition.width}×${project.composition.height} PNG for Resolume Load Input Map.`,
    )
  }

  const onExportVideo = async () => {
    if (exportingVideo) return
    if (project.slices.length === 0) {
      const proceed = window.confirm(
        'No slices yet. Export a black composition-sized video anyway?',
      )
      if (!proceed) return
    }
    setExportingVideo(true)
    setStatus('Encoding video…')
    try {
      await downloadVideo(project, (current, total) => {
        setStatus(`Encoding video frame ${current}/${total}…`)
      })
      const { width, height } = project.composition
      const period = project.export.animation.periodSec
      const fps = project.export.video.fps
      setStatus(
        `Exported ${width}×${height} MP4 (${period}s @ ${fps}fps) for Resolume media / wall tests. PNG remains for Load Input Map.`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Video export failed.'
      setStatus(message)
    } finally {
      setExportingVideo(false)
    }
  }

  const onExportFrames = async () => {
    if (project.slices.length === 0) {
      setStatus('Add at least one slice before exporting frames.')
      return
    }
    setStatus('Exporting frames…')
    try {
      const result = await downloadFrames(project)
      const slicePngs = result.files.length - 1
      const pack = `zip with ${slicePngs} slice PNG${slicePngs === 1 ? '' : 's'} + frames-all.png`
      const clampNote =
        result.clampCount > 0
          ? ` Border clamped on ${result.clampCount} slice${result.clampCount === 1 ? '' : 's'} (too thick for size).`
          : ''
      setStatus(
        `Exported ${pack} — hollow white frames for Radar / outline FX.${clampNote}`,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Frame export failed.'
      setStatus(message)
    }
  }

  const onSaveJson = () => {
    downloadProject(project)
    setStatus('Project JSON downloaded.')
  }

  const onLoadJson = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as unknown
      const result = parseProject(data)
      if (!result.ok) {
        setStatus(`Load failed: ${result.error}`)
        return
      }
      setProject(result.project)
      setCompDraft({
        width: String(result.project.composition.width),
        height: String(result.project.composition.height),
      })
      setSelectedId(result.project.slices[0]?.id ?? null)
      setStatus(`Loaded “${result.project.name}”.`)
    } catch {
      setStatus('Load failed: invalid JSON file.')
    }
  }

  const onImportXml = async (file: File) => {
    try {
      const text = await file.text()
      const imported = parseResolumeScreenSetupXml(text)
      if (project.slices.length > 0) {
        const proceed = window.confirm(
          `Replace current slices with ${imported.slices.length} from XML?`,
        )
        if (!proceed) {
          setStatus('XML import cancelled.')
          return
        }
      }
      setProject((prev) => {
        const composition = imported.composition ?? prev.composition
        return {
          ...prev,
          name: imported.name ?? prev.name,
          composition,
          slices: imported.slices,
        }
      })
      const composition = imported.composition ?? project.composition
      setCompDraft({
        width: String(composition.width),
        height: String(composition.height),
      })
      setSelectedId(imported.slices[0]?.id ?? null)
      const parts = [
        `Imported ${imported.slices.length} slice${imported.slices.length === 1 ? '' : 's'} from Advanced Output XML`,
      ]
      if (imported.skippedCount > 0) {
        parts.push(`skipped ${imported.skippedCount} non-rectangular`)
      }
      if (imported.compositionSource === 'explicit') {
        parts.push(`composition ${composition.width}×${composition.height}`)
      } else if (imported.compositionSource === 'inferred') {
        parts.push(`inferred composition ${composition.width}×${composition.height}`)
      } else {
        parts.push('composition size unchanged — verify in Arena')
      }
      const warningText =
        imported.warnings.length > 0 ? ` (${imported.warnings.join(' ')})` : ''
      setStatus(`${parts.join('; ')}.${warningText}`)
    } catch (err) {
      const message =
        err instanceof ResolumeXmlImportError
          ? err.message
          : 'Import failed: could not read XML.'
      setStatus(`Import failed: ${message}`)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">SliceMap</span>
          <span className="brand-sub">Resolume Arena input maps</span>
        </div>
        <div className="top-actions">
          <div className="action-group" role="group" aria-label="Project">
            <span className="action-group-label">Project</span>
            <button type="button" className="btn btn-secondary" onClick={onSaveJson}>
              Save JSON
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Load JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json,.slicemap.json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onLoadJson(file)
                e.target.value = ''
              }}
            />
          </div>
          <div className="action-group" role="group" aria-label="Import">
            <span className="action-group-label">Import</span>
            <button
              type="button"
              className="btn"
              onClick={() => xmlInputRef.current?.click()}
            >
              Advanced Output
            </button>
            <input
              ref={xmlInputRef}
              type="file"
              accept="application/xml,text/xml,.xml"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImportXml(file)
                e.target.value = ''
              }}
            />
          </div>
          <div className="action-group" role="group" aria-label="Export">
            <span className="action-group-label">Export</span>
            <button type="button" className="btn btn-primary" onClick={onExportPng}>
              Input Map
            </button>
            <div className="menu-anchor" ref={framesMenuRef}>
              <button
                type="button"
                className={framesMenuOpen ? 'btn active' : 'btn'}
                aria-expanded={framesMenuOpen}
                aria-haspopup="dialog"
                onClick={() => setFramesMenuOpen((open) => !open)}
              >
                Slice Frames
              </button>
              {framesMenuOpen && (
                <div className="toolbar-menu" role="dialog" aria-label="Slice frames export">
                  <p className="toolbar-menu-hint">
                    Per-slice hollow PNGs plus <code>frames-all.png</code> (all
                    borders on the composition) for Radar / outline FX — not Load
                    Input Map.
                  </p>
                  <label className="field">
                    <span>Border (px)</span>
                    <input
                      type="number"
                      min={1}
                      max={512}
                      step={1}
                      value={project.export.frameBorderPx}
                      autoFocus
                      onChange={(e) => {
                        const v = Number(e.target.value)
                        if (!Number.isFinite(v) || v <= 0) return
                        updateProject((p) => ({
                          ...p,
                          export: {
                            ...p.export,
                            frameBorderPx: clampFrameBorderPx(v),
                          },
                        }))
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setFramesMenuOpen(false)
                      void onExportFrames()
                    }}
                  >
                    Export frames
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {overlaps.length > 0 && (
        <div className="overlap-hint" role="status">
          Overlap hint: {overlaps.length} pair{overlaps.length === 1 ? '' : 's'} intersect
          ({overlaps.map(({ a, b }) => `${a.name} ∩ ${b.name}`).join(', ')}). Overlaps are
          allowed.
        </div>
      )}

      {status && (
        <div className="status-bar" role="status">
          {status}
          <button type="button" className="linkish" onClick={() => setStatus(null)}>
            dismiss
          </button>
        </div>
      )}

      <div className="workspace">
        <aside className="sidebar">
          <section className="panel workflow-panel">
            <h2>Resolume path</h2>
            <ol className="workflow-steps">
              <li>
                Set composition size (or <strong>Import</strong> a screen setup).
              </li>
              <li>
                Add or adjust slices on the canvas.
              </li>
              <li>
                <strong>Export Input Map</strong> → Arena Advanced Output → Load Input Map.
              </li>
            </ol>
          </section>

          <section className="panel">
            <h2>Composition</h2>
            <label className="field">
              <span>Name</span>
              <input
                value={project.name}
                onChange={(e) =>
                  updateProject((p) => ({ ...p, name: e.target.value }))
                }
              />
            </label>
            <div className="field-row composition-size">
              <label className="field">
                <span>Width (px)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  value={compDraft.width}
                  onChange={(e) => {
                    const width = e.target.value
                    setCompDraft((d) => ({ ...d, width }))
                    const next = clampCompositionSize(
                      Number(width),
                      Number(compDraft.height),
                    )
                    if (next) {
                      updateProject((p) => ({ ...p, composition: next }))
                    }
                  }}
                  onBlur={applyComposition}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyComposition()
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                />
              </label>
              <label className="field">
                <span>Height (px)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  spellCheck={false}
                  value={compDraft.height}
                  onChange={(e) => {
                    const height = e.target.value
                    setCompDraft((d) => ({ ...d, height }))
                    const next = clampCompositionSize(
                      Number(compDraft.width),
                      Number(height),
                    )
                    if (next) {
                      updateProject((p) => ({ ...p, composition: next }))
                    }
                  }}
                  onBlur={applyComposition}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      applyComposition()
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                />
              </label>
            </div>
            <p className="hint">
              Match Arena composition size. Active:{' '}
              {project.composition.width}×{project.composition.height}px.
            </p>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Slices</h2>
              <button type="button" className="btn btn-small btn-primary" onClick={addSlice}>
                Add
              </button>
            </div>
            <ul className="slice-list">
              {project.slices.length === 0 && (
                <li className="muted">No slices yet — add one or import a screen setup.</li>
              )}
              {project.slices.map((slice) => (
                <li key={slice.id}>
                  <button
                    type="button"
                    className={
                      slice.id === selectedId ? 'slice-item active' : 'slice-item'
                    }
                    onClick={() => setSelectedId(slice.id)}
                  >
                    <span
                      className="swatch"
                      style={{ background: slice.color }}
                      aria-hidden
                    />
                    <span className="slice-item-text">
                      <strong>{slice.name}</strong>
                      <small>
                        {Math.round(slice.width)}×{Math.round(slice.height)} ·{' '}
                        {Math.round(slice.rotationDeg)}°
                      </small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="btn-row">
              <button
                type="button"
                className="btn btn-small"
                disabled={!selected}
                onClick={duplicateSelected}
              >
                Duplicate
              </button>
              <button
                type="button"
                className="btn btn-small btn-danger"
                disabled={!selected}
                onClick={deleteSelected}
              >
                Delete
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Inspector</h2>
            {!selected || !geomDraft ? (
              <p className="muted">Select a slice to edit.</p>
            ) : (
              <>
                <label className="field">
                  <span>Name</span>
                  <input
                    value={selected.name}
                    onChange={(e) => updateSlice(selected.id, { name: e.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Color</span>
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(e) => updateSlice(selected.id, { color: e.target.value })}
                  />
                </label>
                <div className="field-row">
                  <label className="field">
                    <span>Offset X</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      value={geomDraft.offsetX}
                      onChange={(e) =>
                        setGeomDraft((d) =>
                          d ? { ...d, offsetX: e.target.value } : d,
                        )
                      }
                      onBlur={() =>
                        commitGeomField('offsetX', (raw) => {
                          const n = Number(raw)
                          return Number.isFinite(n) ? n : null
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Offset Y</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      value={geomDraft.offsetY}
                      onChange={(e) =>
                        setGeomDraft((d) =>
                          d ? { ...d, offsetY: e.target.value } : d,
                        )
                      }
                      onBlur={() =>
                        commitGeomField('offsetY', (raw) => {
                          const n = Number(raw)
                          return Number.isFinite(n) ? n : null
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="field-row">
                  <label className="field">
                    <span>Width</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      value={geomDraft.width}
                      onChange={(e) =>
                        setGeomDraft((d) => (d ? { ...d, width: e.target.value } : d))
                      }
                      onBlur={() =>
                        commitGeomField('width', (raw) => {
                          const n = Number(raw)
                          return Number.isFinite(n) && n > 0 ? n : null
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                  </label>
                  <label className="field">
                    <span>Height</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      spellCheck={false}
                      value={geomDraft.height}
                      onChange={(e) =>
                        setGeomDraft((d) => (d ? { ...d, height: e.target.value } : d))
                      }
                      onBlur={() =>
                        commitGeomField('height', (raw) => {
                          const n = Number(raw)
                          return Number.isFinite(n) && n > 0 ? n : null
                        })
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          ;(e.target as HTMLInputElement).blur()
                        }
                      }}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Rotation (°)</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    spellCheck={false}
                    value={geomDraft.rotationDeg}
                    onChange={(e) =>
                      setGeomDraft((d) =>
                        d ? { ...d, rotationDeg: e.target.value } : d,
                      )
                    }
                    onBlur={() =>
                      commitGeomField('rotationDeg', (raw) => {
                        const n = Number(raw)
                        return Number.isFinite(n) ? n : null
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        ;(e.target as HTMLInputElement).blur()
                      }
                    }}
                  />
                </label>
              </>
            )}
          </section>

          <section className="panel">
            <h2>Input Map appearance</h2>
            <p className="hint">
              Controls the composition PNG for Arena → Load Input Map (toolbar{' '}
              <strong>Export → Input Map</strong>).
            </p>
            <label className="field">
              <span>Outline stroke (px)</span>
              <input
                type="number"
                min={1}
                step={1}
                value={project.export.strokeWidth}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (!Number.isFinite(v) || v <= 0) return
                  updateProject((p) => ({
                    ...p,
                    export: { ...p.export, strokeWidth: v },
                  }))
                }}
              />
            </label>
            <label className="field">
              <span>Slice design</span>
              <select
                value={project.export.design}
                onChange={(e) => {
                  const design = e.target.value as SliceDesign
                  updateProject((p) => ({
                    ...p,
                    export: { ...p.export, design },
                  }))
                }}
              >
                <option value="simple">Simple</option>
                <option value="caro">Caro</option>
                <option value="cross">Cross</option>
              </select>
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.showDimensions}
                onChange={(e) => {
                  const showDimensions = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: { ...p.export, showDimensions },
                  }))
                }}
              />
              <span>Show dimensions on slices</span>
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.guides.enabled}
                onChange={(e) => {
                  const enabled = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      guides: { ...p.export.guides, enabled },
                    },
                  }))
                }}
              />
              <span>Geometry guides</span>
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.guides.showCircle}
                disabled={!project.export.guides.enabled}
                onChange={(e) => {
                  const showCircle = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      guides: { ...p.export.guides, showCircle },
                    },
                  }))
                }}
              />
              <span>Center circle</span>
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.guides.showCross}
                disabled={!project.export.guides.enabled}
                onChange={(e) => {
                  const showCross = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      guides: { ...p.export.guides, showCross },
                    },
                  }))
                }}
              />
              <span>Center cross lines</span>
            </label>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.guides.showLabelPlate}
                disabled={!project.export.guides.enabled}
                onChange={(e) => {
                  const showLabelPlate = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      guides: { ...p.export.guides, showLabelPlate },
                    },
                  }))
                }}
              />
              <span>Label border plate</span>
            </label>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={onExportPng}>
                Export Input Map
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Test video</h2>
            <p className="hint">
              Optional H.264 MP4 for wall / LED stress tests (black plate). Not used for Load
              Input Map.
            </p>
            <label className="field field-check">
              <input
                type="checkbox"
                checked={project.export.animation.enabled}
                onChange={(e) => {
                  const enabled = e.target.checked
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      animation: { ...p.export.animation, enabled },
                    },
                  }))
                }}
              />
              <span>Animate preview</span>
            </label>
            <label className="field">
              <span>Animation style</span>
              <select
                value={project.export.animation.style}
                disabled={!project.export.animation.enabled}
                onChange={(e) => {
                  const style = e.target.value as AnimationStyle
                  updateProject((p) => ({
                    ...p,
                    export: {
                      ...p.export,
                      animation: { ...p.export.animation, style },
                    },
                  }))
                }}
              >
                <option value="phase-scroll">Phase scroll</option>
                <option value="pulse">Pulse</option>
              </select>
            </label>
            <div className="field-row">
              <label className="field">
                <span>Loop (sec)</span>
                <input
                  type="number"
                  min={0.5}
                  max={60}
                  step={0.5}
                  value={project.export.animation.periodSec}
                  onChange={(e) => {
                    const periodSec = clampPeriodSec(Number(e.target.value))
                    updateProject((p) => ({
                      ...p,
                      export: {
                        ...p.export,
                        animation: { ...p.export.animation, periodSec },
                      },
                    }))
                  }}
                />
              </label>
              <label className="field">
                <span>Video fps</span>
                <input
                  type="number"
                  min={15}
                  max={60}
                  step={1}
                  value={project.export.video.fps}
                  onChange={(e) => {
                    const fps = clampFps(Number(e.target.value))
                    updateProject((p) => ({
                      ...p,
                      export: {
                        ...p.export,
                        video: { ...p.export.video, fps },
                      },
                    }))
                  }}
                />
              </label>
            </div>
            <div className="btn-row">
              <button
                type="button"
                className="btn"
                onClick={() => void onExportVideo()}
                disabled={exportingVideo}
              >
                {exportingVideo ? 'Encoding…' : 'Export Test Video'}
              </button>
            </div>
          </section>

          <section className="panel help">
            <h2>Tips</h2>
            <ul className="tips-list">
              <li>
                Screen setups: Documents → Resolume → <code>presets/screensetup/</code>
              </li>
              <li>Canvas: Ctrl/⌘+scroll zoom · scroll / Space-drag to pan</li>
              <li>
                <strong>Export → Slice Frames</strong> downloads per-slice borders plus{' '}
                <code>frames-all.png</code> (all borders on one composition image)
              </li>
              <li>XML import is best-effort (rectangular InputRect only)</li>
            </ul>
          </section>
        </aside>

        <main className="main">
          <EditorCanvas
            project={project}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onUpdateSlice={updateSlice}
            zoom={zoom}
            onZoomChange={setZoom}
            onAddSlice={addSlice}
            onImportAdvancedOutput={() => xmlInputRef.current?.click()}
          />
        </main>
      </div>
    </div>
  )
}
