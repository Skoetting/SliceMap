## Context

SliceMap already stores slice position as center (`cx`, `cy`) and the inspector exposes **Center X** / **Center Y**. Canvas drag updates those same fields. For mapping work, users often think in **placement offset** from the composition’s top-left origin (“this panel starts at 120, 80”), not in slice centers.

This change keeps the center-based model (needed for rotation around the slice center) and makes **Offset X** / **Offset Y** the primary numeric position properties in the inspector.

## Goals / Non-Goals

**Goals:**

- Let users type exact Offset X / Offset Y for the selected slice
- Define offset as the top-left of the **unrotated** slice rectangle in composition pixels
- Keep drag-and-drop and numeric entry as two views of the same geometry
- Leave project JSON, export, and snap math on `cx` / `cy`

**Non-Goals:**

- Persisting `offsetX` / `offsetY` in the project schema
- Changing resize/rotate handle behavior
- Multi-slice bulk offset editing
- Showing offset for every slice in the list without selection
- Replacing magnetic snap or other canvas assist features

## Decisions

### 1. Offset = top-left of unrotated rectangle

- `offsetX = cx - width / 2`
- `offsetY = cy - height / 2`
- Commit path: `cx = offsetX + width / 2`, `cy = offsetY + height / 2`

**Why:** Matches “where is this panel placed?” and Resolume-style top-left composition thinking. Unrotated top-left stays well-defined when the slice is rotated (rotation still pivots around center).

**Alternatives considered:**

- Keep Center X/Y labels only → does not match the user’s “offset” language
- Store top-left in JSON instead of center → larger migration; rotation math already assumes center
- Use AABB top-left after rotation → shifts when rotation changes; harder to reason about

### 2. Inspector draft uses offset strings, commits as center

- Geometry draft fields become `offsetX` / `offsetY` (plus existing size/rotation)
- On select / after drag / after size change: rebuild draft from current `cx`/`cy`/`width`/`height`
- On blur/Enter for offset: parse number → write `cx`/`cy`
- Invalid input reverts to the last derived offset (same pattern as today’s center fields)

**Why:** Minimal change to `App.tsx` commit flow; canvas and snap keep writing centers.

### 3. Resize keeps center; offsets update

When width/height change, existing behavior keeps `cx`/`cy` fixed. Offset fields recalculate so the displayed top-left moves when size changes around a fixed center.

**Why:** Avoid surprising jumps of the visual center during resize; offsets remain a derived view.

### 4. Pure helpers in the model layer

Add small converters (e.g. in `geometry.ts`):

- `sliceOffset(slice) → { offsetX, offsetY }`
- `centerFromOffset(offsetX, offsetY, width, height) → { cx, cy }`

**Why:** Easy to unit-test and reuse; keeps UI free of duplicated math.

## Risks / Trade-offs

- [Users who already learned Center X/Y] → Mitigation: replace labels clearly with Offset X/Y; values will differ from previous center numbers (document in UI only; no migration needed)
- [Rotated slices: typed offset is not the visual AABB corner] → Mitigation: document as unrotated top-left; rotation still around center (unchanged)
- [Half-pixel centers when odd sizes + integer offsets] → Mitigation: allow fractional numbers (existing inspector already supports decimals)

## Migration Plan

- No file format change; existing projects load as today
- UI-only switch from center fields to offset fields
- Rollback: restore Center X/Y bindings if needed

## Open Questions

- None blocking; if product later wants both center and offset fields visible, that can be additive.
