## Context

SliceMap already exports a full-composition PNG (Load Input Map) and an MP4 wall-test video. Per-slice **frame** PNGs are a different deliverable: hollow rectangular borders used as clip media so Resolume stock effects (Radar, edge-style looks, etc.) can drive outline motion without plugins.

Each SliceMap slice already has `width` / `height` in composition pixels. Frame export should use that local size (unrotated), matching how clip media is typically authored before Advanced Output warps it onto the wall.

## Goals / Non-Goals

**Goals:**
- Let the user set a frame **border size** in pixels
- Export one transparent PNG per slice with only that rectangular border drawn
- Make multi-slice export practical (zip when >1)
- Keep composition PNG / video / JSON workflows unchanged
- Document the Radar-style outline workflow briefly in UI/README

**Non-Goals:**
- Animated frame videos in v1 (static PNGs only)
- Soft edges, rounded corners, or bezier outlines
- Auto-wiring into Resolume via OSC/REST
- Replacing Load Input Map PNGs with frames
- Per-slice border overrides (one global border size is enough for v1)

## Decisions

### 1. Image size = unrotated slice width × height
- **Choice:** Each frame PNG is `Math.round(slice.width)` × `Math.round(slice.height)` with a transparent background and an inset border of `frameBorderPx` thickness.
- **Why:** Radar and similar effects run on clip pixels; local slice size matches the panel content area. Rotation lives in Advanced Output / slice placement, not in the media file.
- **Alternatives considered:** Composition-sized images with one outline each (heavier, harder to reuse as clips); include rotation baked in (awkward for FX).

### 2. Separate `frameBorderPx` from input-map `strokeWidth`
- **Choice:** Add `export.frameBorderPx` (default e.g. 8–16), independent of the test-pattern outline stroke.
- **Why:** Input-map strokes are often thin for guides; FX frames usually want a thicker band. Mixing them surprises users.
- **Alternatives considered:** Reuse `strokeWidth` (simpler settings, wrong defaults for both jobs).

### 3. Border appearance: opaque white (optional slice color later)
- **Choice:** v1 draws an opaque white (`#FFFFFF`) border; interior fully transparent (alpha 0). No labels, guides, or fill patterns.
- **Why:** White frames tint cleanly under Resolume colorize / FX; alpha interior lets underlying content show through when layered.
- **Alternatives considered:** Use slice color (pretty in SliceMap, less flexible in Arena); black border (worse for additive looks).

### 4. Border geometry
- **Choice:** Draw as a stroked rect or even-odd fill (outer rect minus inner rect) with border fully inside the image bounds so edges aren’t clipped. Clamp border so `2 * border < min(w,h)` (leave at least 1px hollow when possible; if slice too small, draw max feasible border and warn).
- **Why:** Predictable pixel footprint for FX; avoids half-pixel clipping at PNG edges.
- **Alternatives considered:** Centered stroke straddling the edge (loses outer half of border).

### 5. Download packaging
- **Choice:** Single slice → one PNG download. Multiple slices → one `.zip` of PNGs named from sanitized slice names (`frame-<safe-name>.png`), with collision suffixes if needed. Prefer a tiny in-browser zip (e.g. minimal hand-rolled store or a small dep) over N sequential downloads (popup blockers).
- **Why:** LED walls often have dozens of panels; zip is the usable path.
- **Alternatives considered:** Only sequential downloads (blocked/noisy); always zip even for one file (slightly worse UX).

### 6. UI placement
- **Choice:** Export settings: “Frame border (px)” + **Export frames** button near Export PNG/video. Status reports count exported. Help note: use with Radar / similar for outlines.
- **Why:** Discoverable next to other exports; doesn’t clutter the canvas.

## Risks / Trade-offs

- **[Risk] Very small slices vs thick border** → Clamp border; status warning when clamped.
- **[Risk] Zip dependency weight** → Prefer minimal implementation; avoid large libraries if a small store-only zip suffices.
- **[Risk] Filename collisions / unsafe characters** → Sanitize names; append `-2`, `-3` on collision.
- **[Trade-off] No preview of frame-only look on canvas in v1** → Export is the source of truth; optional later.

## Migration Plan

- Additive `export.frameBorderPx` with default; older JSON loads get the default via persistence parsing.
- No breaking schema version bump required if parser treats missing field as default (same pattern as animation/guides).

## Open Questions

- Exact default border (lean: **12px**).
- Whether a one-slice “export selected only” toggle is needed (lean: **all slices** in v1; selected-only can wait).
