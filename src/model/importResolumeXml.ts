import type { Point } from './geometry'
import { createId } from './project'
import {
  boundsOfPoints,
  rectFromRectangularQuad,
} from './rectFromQuad'
import { DEFAULT_COLORS, type Composition, type Slice } from './types'

export type CompositionSizeSource = 'explicit' | 'inferred' | 'none'

export interface ResolumeXmlImportResult {
  composition: Composition | null
  compositionSource: CompositionSizeSource
  slices: Slice[]
  skippedCount: number
  warnings: string[]
  /** Suggested project name from XmlState / ScreenSetup when present. */
  name: string | null
}

export class ResolumeXmlImportError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ResolumeXmlImportError'
  }
}

interface XmlEl {
  tag: string
  attrs: Record<string, string>
  children: XmlEl[]
}

/** Minimal XML element parser for Resolume screen-setup presets (no DTD/entities). */
export function parseXmlElements(xmlText: string): XmlEl {
  const cleaned = xmlText.replace(/<\?xml[\s\S]*?\?>/i, '').replace(/<!--[\s\S]*?-->/g, '')
  const tokens = cleaned.match(/<\/?[^>]+>/g)
  if (!tokens || tokens.length === 0) {
    throw new ResolumeXmlImportError('File does not look like XML.')
  }

  const rootStack: XmlEl[] = [{ tag: '#root', attrs: {}, children: [] }]
  const attrRe = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/g

  for (const raw of tokens) {
    if (raw.startsWith('<?') || raw.startsWith('<!')) continue
    if (raw.startsWith('</')) {
      const tag = raw.slice(2, -1).trim().split(/\s+/)[0]
      if (rootStack.length <= 1) continue
      const top = rootStack[rootStack.length - 1]
      if (top.tag.toLowerCase() === tag.toLowerCase()) rootStack.pop()
      continue
    }

    const selfClosing = raw.endsWith('/>')
    const inner = raw.slice(1, selfClosing ? -2 : -1).trim()
    const sp = inner.search(/\s/)
    const tag = (sp === -1 ? inner : inner.slice(0, sp)).trim()
    const attrPart = sp === -1 ? '' : inner.slice(sp)
    const attrs: Record<string, string> = {}
    attrRe.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = attrRe.exec(attrPart)) !== null) {
      const key = m[1]
      if (!key) continue
      attrs[key] = m[2] ?? m[3] ?? ''
    }
    const node: XmlEl = { tag, attrs, children: [] }
    rootStack[rootStack.length - 1].children.push(node)
    if (!selfClosing) rootStack.push(node)
  }

  const doc = rootStack[0]
  const elements = doc.children.filter((c) => c.tag !== '#text')
  if (elements.length === 0) {
    throw new ResolumeXmlImportError('XML has no root element.')
  }
  return elements[0]
}

function findAll(root: XmlEl, tagName: string): XmlEl[] {
  const want = tagName.toLowerCase()
  const out: XmlEl[] = []
  const walk = (n: XmlEl) => {
    if (n.tag.toLowerCase() === want) out.push(n)
    for (const c of n.children) walk(c)
  }
  walk(root)
  return out
}

function findFirst(root: XmlEl, tagName: string): XmlEl | null {
  return findAll(root, tagName)[0] ?? null
}

function attr(el: XmlEl, name: string): string | undefined {
  const want = name.toLowerCase()
  for (const [k, v] of Object.entries(el.attrs)) {
    if (k.toLowerCase() === want) return v
  }
  return undefined
}

function parseNum(raw: string | undefined): number | null {
  if (raw === undefined || raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function readVertices(inputRect: XmlEl): Point[] {
  const points: Point[] = []
  for (const child of inputRect.children) {
    if (child.tag.toLowerCase() !== 'v') continue
    const x = parseNum(attr(child, 'x'))
    const y = parseNum(attr(child, 'y'))
    if (x === null || y === null) continue
    points.push({ x, y })
  }
  return points
}

function sliceNameNear(inputRect: XmlEl, root: XmlEl): string {
  // Walk ancestors via parent search: find enclosing Slice, then Name param
  const slices = findAll(root, 'Slice')
  for (const slice of slices) {
    if (!containsNode(slice, inputRect)) continue
    const nameParam = findParamValue(slice, 'Name')
    if (nameParam) return nameParam
    const n = attr(slice, 'name')
    if (n) return n
  }
  const screens = findAll(root, 'Screen')
  for (const screen of screens) {
    if (!containsNode(screen, inputRect)) continue
    const nameParam = findParamValue(screen, 'Name')
    if (nameParam) return nameParam
    const n = attr(screen, 'name')
    if (n) return n
  }
  return 'Imported slice'
}

function containsNode(ancestor: XmlEl, target: XmlEl): boolean {
  if (ancestor === target) return true
  return ancestor.children.some((c) => containsNode(c, target))
}

function findParamValue(scope: XmlEl, paramName: string): string | null {
  const want = paramName.toLowerCase()
  for (const p of findAll(scope, 'Param')) {
    const n = attr(p, 'name')
    if (n && n.toLowerCase() === want) {
      const v = attr(p, 'value')
      if (v !== undefined && v !== '') return v
    }
  }
  return null
}

function readExplicitComposition(root: XmlEl): Composition | null {
  const candidates = [
    ...findAll(root, 'CurrentCompositionTextureSize'),
    ...findAll(root, 'CompositionSize'),
    ...findAll(root, 'CompositionTextureSize'),
  ]
  // Also any element with name="0:1" (or N:M) and width/height attrs
  const walk = (n: XmlEl) => {
    const name = attr(n, 'name')
    if (name && /^\d+:\d+$/.test(name)) candidates.push(n)
    for (const c of n.children) walk(c)
  }
  walk(root)

  for (const el of candidates) {
    const width = parseNum(attr(el, 'width'))
    const height = parseNum(attr(el, 'height'))
    if (width !== null && height !== null && width > 0 && height > 0) {
      return { width: Math.round(width), height: Math.round(height) }
    }
  }
  return null
}

/**
 * Parse a Resolume Advanced Output screen-setup XML string into SliceMap slices.
 * Best-effort: undocumented format; rectangular InputRect only.
 */
export function parseResolumeScreenSetupXml(xmlText: string): ResolumeXmlImportResult {
  const warnings: string[] = []
  let root: XmlEl
  try {
    root = parseXmlElements(xmlText)
  } catch (err) {
    if (err instanceof ResolumeXmlImportError) throw err
    throw new ResolumeXmlImportError('Could not parse XML.')
  }

  const screenSetup =
    root.tag.toLowerCase() === 'screensetup'
      ? root
      : findFirst(root, 'ScreenSetup')

  if (!screenSetup) {
    throw new ResolumeXmlImportError(
      'Unrecognized format: expected Resolume ScreenSetup / Advanced Output preset XML.',
    )
  }

  const name =
    attr(root, 'name') && root.tag.toLowerCase() === 'xmlstate'
      ? attr(root, 'name')!
      : attr(screenSetup, 'name') && attr(screenSetup, 'name') !== 'ScreenSetup'
        ? attr(screenSetup, 'name')!
        : attr(root, 'name') ?? null

  const inputRects = findAll(screenSetup, 'InputRect')
  if (inputRects.length === 0) {
    throw new ResolumeXmlImportError(
      'No InputRect slices found in this screen setup.',
    )
  }

  const slices: Slice[] = []
  let skippedCount = 0
  const allImportedPoints: Point[] = []

  for (const rect of inputRects) {
    const verts = readVertices(rect)
    const geom = rectFromRectangularQuad(verts)
    if (!geom) {
      skippedCount += 1
      continue
    }
    allImportedPoints.push(...verts)
    const color = DEFAULT_COLORS[slices.length % DEFAULT_COLORS.length]
    slices.push({
      id: createId(),
      name: sliceNameNear(rect, screenSetup),
      cx: geom.cx,
      cy: geom.cy,
      width: geom.width,
      height: geom.height,
      rotationDeg: geom.rotationDeg,
      color,
    })
  }

  if (slices.length === 0) {
    throw new ResolumeXmlImportError(
      `Found ${inputRects.length} InputRect(s) but none were rectangular enough to import.`,
    )
  }

  if (skippedCount > 0) {
    warnings.push(
      `Skipped ${skippedCount} non-rectangular or unsupported InputRect${skippedCount === 1 ? '' : 's'}.`,
    )
  }

  let composition = readExplicitComposition(root)
  let compositionSource: CompositionSizeSource = composition ? 'explicit' : 'none'

  if (!composition) {
    const bounds = boundsOfPoints(allImportedPoints)
    if (bounds) {
      const width = Math.max(1, Math.ceil(bounds.maxX))
      const height = Math.max(1, Math.ceil(bounds.maxY))
      // Only infer if the AABB suggests a positive composition origin area
      if (bounds.minX >= -1 && bounds.minY >= -1 && width >= 16 && height >= 16) {
        composition = { width, height }
        compositionSource = 'inferred'
        warnings.push(
          `Composition size inferred as ${width}×${height}px from input bounds — verify against Arena.`,
        )
      } else {
        warnings.push(
          'Composition size missing in preset; keeping your current size — verify after import.',
        )
      }
    } else {
      warnings.push(
        'Composition size missing in preset; keeping your current size — verify after import.',
      )
    }
  }

  return {
    composition,
    compositionSource,
    slices,
    skippedCount,
    warnings,
    name: name && name !== 'ScreenSetup' ? name : null,
  }
}
