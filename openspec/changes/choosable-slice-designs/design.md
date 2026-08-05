## Context

SliceMap draws every slice the same way today: semi-transparent solid fill, colored outline, and a centered label with **name + `W×H`**. Drawing lives in `drawSliceOnContext` (`src/model/exportPng.ts`) and is shared by the editor preview and PNG export. The slice model (`Slice`) has no style field; export settings only store `strokeWidth`.

VJs often want Mapping Guru–style guides: a **caro** (checkered) fill across each slice, or a **cross** spanning each full slice, while keeping a **simple** flat fill when preferred. For now these choices are **composition-wide** (one design for all slices). Dimension text is useful for verification but sometimes clutters small slices—so it should be optional at the project level.

## Goals / Non-Goals

**Goals:**
- Composition-wide choosable visual design: `simple` | `caro` | `cross` (applies to all slices)
- Same design rendered in editor preview and PNG export
- Project-level toggle to include or omit slice dimensions in on-slice labels
- Persist new fields with backward-compatible defaults for existing JSON
- UI in composition/export settings for design + dimension labels

**Non-Goals:**
- Per-slice design overrides (deferred; all slices share one design for now)
- Additional patterns beyond the three (e.g. dots, diagonals-only, logos)
- Per-slice label toggles (name on/off, custom label text) in this change
- Changing geometry, overlap, snap, or Resolume XML export
- Configurable caro cell size / cross thickness as separate user settings (use sensible defaults derived from stroke width / slice size)
- Different designs for editor vs export

## Decisions

### 1. Store design on export / project settings
- **Choice:** Add `design: SliceDesign` to `ExportSettings`, where `SliceDesign = 'simple' | 'caro' | 'cross'`. Default `'simple'` for new projects and when loading older projects. Every slice is drawn with `project.export.design`.
- **Why:** User requested composition-wide options for now; one control, simpler model, matches how Mapping Guru often applies a global guide style.
- **Alternatives considered:** Per-slice `design` (more flexible; deferred); composition object instead of export (either works; export already holds stroke/label visual policy).

### 2. Visual definitions
- **Simple:** Current behavior — translucent fill of `slice.color` + outline.
- **Caro:** Checkerboard (karo) pattern covering the entire unrotated slice rectangle (then transformed with the slice). Alternating cells use the slice color at two alphas (or color vs transparent) so the pattern reads clearly under Resolume’s input-map opacity. Clip drawing to the slice rect.
- **Cross:** A full-slice cross: one horizontal and one vertical bar/line through the slice center, spanning edge-to-edge of the slice bounds, plus the existing outline. Bars use the slice color (opaque or high-alpha stroke/fill) so they read like Mapping Guru alignment crosses. Optional light translucent fill underneath for hit readability in the editor (keep subtle on export).
- **Why:** Matches the three requested looks without inventing extra styles.
- **Alternatives considered:** Diagonal X-only cross (less common for LED panel alignment); stroke-only caro grid without filled cells (weaker on bright stages).

### 3. Shared draw path for editor and export
- **Choice:** Extend `drawSliceOnContext` to take the project `design` (and `showDimensions`) after applying the existing center+rotate transform. Editor and export keep calling the same function.
- **Why:** Guarantees WYSIWYG; avoids duplicating pattern math.
- **Alternatives considered:** Separate export renderer (drift risk).

### 4. Dimension labels as export/label setting
- **Choice:** Add `showDimensions: boolean` to `ExportSettings` (default `true` to preserve current PNG/editor label behavior). When `false`, draw the name only (no `W×H` line). When `true`, keep name + dimensions as today.
- **Why:** Label clutter is a project-wide preference for the input map; one checkbox next to design is enough.
- **Alternatives considered:** Per-slice `showDimensions` (deferred); remove dimensions entirely (regressive).

### 5. Persistence and versioning
- **Choice:** Keep `version: 1`. On load, missing `design` → `'simple'`; missing `showDimensions` → `true`. Unknown `design` strings fall back to `'simple'`.
- **Why:** Additive fields; no forced schema bump; old files keep looking the same after load.
- **Alternatives considered:** Bump to `version: 2` (unnecessary if defaults are safe).

### 6. Inspector placement
- **Choice:** Both **Design** (segmented control or select: `simple` / `caro` / `cross`) and **Show dimensions** live next to existing outline stroke / export controls (composition-wide).
- **Why:** Both are project visual policy; no per-slice inspector control in this change.
- **Alternatives considered:** Design on selected-slice inspector (rejected for now).

### 7. Caro cell sizing
- **Choice:** Derive cell size from each slice’s size (e.g. target ~8–16 cells along the shorter side, clamped to a min/max pixel size) so small and large slices both show a readable checker without a new setting.
- **Why:** Avoids another numeric control in v1; patterns still span the whole slice.
- **Alternatives considered:** Fixed 32px cells (uneven on tiny slices); user-configurable cell size (defer).

### 8. Cross geometry
- **Choice:** Axis-aligned `+` in slice local space (after rotate transform): vertical line/bar at `x = 0` from `-h/2` to `h/2`, horizontal at `y = 0` from `-w/2` to `w/2`. Thickness proportional to `strokeWidth` (e.g. `max(strokeWidth, ~2% of min(w,h))`).
- **Why:** Reads as a full-slice cross regardless of rotation in composition space; matches Mapping Guru–style panel crosses.
- **Alternatives considered:** World-axis cross ignoring slice rotation (wrong for rotated panels).

## Risks / Trade-offs

- **[Risk] Dense caro on tiny slices becomes noise** → Clamp minimum cell size; if fewer than ~2 cells fit, fall back to a coarser grid or still draw at least a 2×2.
- **[Risk] Cross + label overlap at center** → Keep label drawing after the pattern; existing halo/stroke on text remains; optionally nudge label slightly if needed later.
- **[Risk] Performance drawing many caro cells on large 4K comps** → Cap cell count; use canvas `fillRect` loops or a clipped pattern; patterns only redraw on canvas invalidate (already the case).
- **[Trade-off] Composition-wide design only** → Cannot mix caro and simple on different slices; acceptable for v1; per-slice can be a follow-up.
- **[Trade-off] No user caro cell size** → Some users may want Mapping Guru’s exact grid; can add later without changing the `design` enum.

## Migration Plan

- Existing projects without new fields load as **simple** + **show dimensions on**.
- Save writes `design` and `showDimensions` under `export`.
- Rollback: older app builds that ignore unknown JSON keys still open files; current loader should ignore extras or only read known keys (today’s pattern).

## Open Questions

- Exact caro cell heuristic (lean: ~12 cells on the short side, cell size clamped ~8–64 px).
- Whether **cross** includes a light base fill (lean: **yes**, very low alpha, so empty-looking slices remain selectable in the editor).
- Whether the editor should show dimension text according to `showDimensions` even when zoomed (lean: **yes** — same rules as export).
