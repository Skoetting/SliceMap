## Context

SliceMap already models a composition and rectangular slices, then exports PNG (Load Input Map) and MP4 (wall-test media). Operators often already have a Resolume Advanced Output **screen setup** preset saved as XML under Documents → Resolume Arena/Avenue → `presets/screensetup/`. Recreating those input slices by hand only to generate a matching test pattern is wasteful.

Resolume does not publish an official schema for this XML; it may change without notice. Import is therefore a **best-effort, version-tolerant** reader focused on the data SliceMap needs: composition size and rectangular **input** geometry (source rects on the composition), not output warps or device routing.

## Goals / Non-Goals

**Goals:**
- Import a screen-setup `.xml` file from disk into the current editor session
- Populate composition width/height when present in the preset
- Create one SliceMap slice per supported rectangular input region (name, center, size, rotation)
- Let the user immediately preview, animate, and export PNG/MP4 against the imported layout
- Clear errors when the file is not a usable Advanced Output preset

**Non-Goals:**
- Exporting SliceMap projects back to Resolume Advanced Output XML
- Editing bezier/homography warps, soft edges, or output device lists
- Importing full `.avc` compositions or Arena show files
- Live connection to a running Resolume instance
- Guaranteeing support for every historical Resolume major version forever

## Decisions

### 1. Source of truth: InputRect (composition space)
- **Choice:** Map each slice primarily from its **input** rectangle / input polygon on the composition (`InputRect` or equivalent vertices in composition coordinates). Ignore or lightly use `OutputRect` / warper destinations for v1 placement.
- **Why:** SliceMap is an input-map / test-pattern tool; test patterns live in composition space. Output warps belong to the display path.
- **Alternatives considered:** Reconstruct from OutputRect (wrong space for our PNG/MP4); import only screen names without geometry (useless).

### 2. Rectangular slices only in v1
- **Choice:** Accept slices whose input corners form an axis-aligned or uniformly rotated rectangle (4 corners, opposite sides equal within tolerance). Derive `width`, `height`, `cx`, `cy`, `rotationDeg` from the quad. Soft-fail non-rectangular / heavily warped inputs with a count in the status message (“Imported N slices; skipped M non-rectangular”).
- **Why:** SliceMap’s model is rectangles; supporting arbitrary polygons is a larger change.
- **Alternatives considered:** Approximate any polygon with its AABB (loses rotation/accuracy); reject entire file if any slice is warped (too harsh).

### 3. Composition size
- **Choice:** Prefer explicit composition/size attributes if present in the preset; otherwise infer as the axis-aligned bounding box of all imported input rects (rounded up), or fall back to keeping the current project size with a warning.
- **Why:** Some presets omit a clear global size; inference unblocks the workflow.
- **Alternatives considered:** Always require user to set size first (extra friction).

### 4. Replace vs merge
- **Choice:** Default **replace** slices (and update composition size) after confirm if the project already has slices. Optional later: “Add to existing.” v1 = replace-after-confirm.
- **Why:** Import is usually “load my show mapping,” not incremental merge; avoids duplicate stacked slices.
- **Alternatives considered:** Always merge (duplicate risk); always wipe without confirm (destructive).

### 5. Parsing approach
- **Choice:** Browser `DOMParser` + defensive queries for known element/attribute patterns observed in Arena screen-setup files (`XmlState` / `ScreenSetup` / `Screen` / slice nodes / `InputRect` / `v` points). Normalize names from `name` attributes. Assign new SliceMap `id`s via `createId()`; cycle `DEFAULT_COLORS`.
- **Why:** No native deps; works on GitHub Pages; easy to extend when Resolume tweaks tags.
- **Alternatives considered:** Regex-only parse (fragile); server-side convert (out of scope).

### 6. Rotation extraction
- **Choice:** If `InputRect` has `orientation` or equivalent, use it; else estimate rotation from the first edge angle of the input quad (normalized to SliceMap’s degrees).
- **Why:** Matches how Resolume stores/orients input slices in many presets.
- **Alternatives considered:** Always force 0° and AABB only (loses diagonal panels).

### 7. UI placement
- **Choice:** **Import XML** button beside Load JSON; accept `.xml`. Status bar reports import summary. Help/README note the Documents `presets/screensetup` path and that format is unofficial.
- **Why:** Symmetric with existing JSON load; discoverable for Resolume users.

## Risks / Trade-offs

- **[Risk] Undocumented XML changes across Resolume versions** → Version-tolerant parsing; test fixtures from at least one known Arena export; clear “unrecognized format” error; no claim of official support.
- **[Risk] Soft-edge / mask / multi-polygon slices skipped** → Report skip count; user can still get majority of LED panels.
- **[Risk] Wrong composition size inference** → Prefer explicit size; allow user to edit composition after import.
- **[Trade-off] No XML export** → One-way convenience; exporting remains PNG/MP4/JSON.

## Migration Plan

- Additive feature; no project schema change required (imported data becomes a normal `SliceMapProject`).
- Existing JSON projects unaffected.

## Open Questions

- Exact tag names for composition size across Arena 6/7 (lean: probe common attributes during implementation; keep fixtures).
- Whether nested `Screen` → multiple `Slice` children need flattening (lean: yes, one SliceMap slice per input rect found).
- Soft confirmation copy when replacing (lean: “Replace current slices with N from XML?”).
