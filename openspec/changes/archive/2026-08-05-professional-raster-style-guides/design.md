## Context

SliceMap draws each slice with a fill design (`simple` / `caro` / `cross`), a colored stroke outline, and centered label text via `drawSliceOnContext`. Caro already works well as a LED panel checker. Animation (phase-scroll / pulse) currently modulates **fill/pattern alphas only**—outlines and labels stay static. Video export and PNG share that draw path.

Operators want a more professional RasterVideo-style panel: clear frame, center cross, inscribed circle, and labels that read on busy checkers—plus motion on the **guides** (not only the caro) when exporting wall-test video. Reference discussion: [RasterVideo test patterns on r/VIDEOENGINEERING](https://www.reddit.com/r/VIDEOENGINEERING/comments/1l99qmd/rastervideo_tool_for_creating_test_patterns/).

## Goals / Non-Goals

**Goals:**
- RasterVideo-inspired geometry overlays on every slice: strong outline/frame, edge-to-edge center cross, inscribed center circle
- Label plates (subtle bordered background) behind on-slice text
- Same look in editor, PNG input map, and MP4 frames
- When animation is enabled, animate cross + circle (and optionally outline emphasis) in preview and video
- Keep caro / simple / cross fills; overlays sit on top

**Non-Goals:**
- Full SMPTE/EBU color bars or multi-zone TV test cards
- Per-slice overlay toggles (composition-wide only for v1)
- Replacing MP4/PNG export pipelines
- New fill designs beyond the three existing ones
- Exact pixel-clone of RasterVideo branding/UI

## Decisions

### 1. Overlays are composition-wide and always drawn (with optional master toggle)
- **Choice:** Add `export.guides` settings: `{ enabled: true, showCross: true, showCircle: true, showLabelPlate: true }` (defaults **on** for the pro look). When `enabled` is false, keep today’s outline+label behavior only (no circle/cross overlay extras beyond the fill design’s own cross when design=`cross`).
- **Why:** Matches “make it look professional by default”; power users can dial back. Avoids per-slice complexity.
- **Alternatives considered:** Always-on with no settings (less flexible); bake circle only into a new `raster` design enum (forces users off caro).

### 2. Draw order
- **Choice:** Inside slice local transform: (1) fill design, (2) geometry guides (circle + cross when enabled), (3) outer frame stroke, (4) label plate + text. Clip fills to slice rect; guides stroke inside the rect (inset by ~half stroke so they don’t clip oddly).
- **Why:** Guides sit above caro so they stay visible; labels on top stay readable.
- **Alternatives considered:** Guides under fill (hidden by dense caro).

### 3. Geometry definitions
- **Frame:** Rectangle stroke at slice bounds using `strokeWidth` (existing control); optionally a thin inner inset line at ~40% alpha for a “double frame” RasterVideo vibe when guides enabled.
- **Cross:** Axis-aligned H+V through local origin, full width/height, stroke (not fat filled bars)—distinct from the current `cross` **fill design** which uses thick bars. When design is already `cross`, skip duplicate thick bars or thin the overlay—**lean:** if design=`cross`, keep design bars and still draw the circle + frame + label plate; overlay cross strokes optional/off by default when design=`cross` to avoid double-cross clutter (`showCross` still respected).
- **Circle:** Centered at origin; radius = `min(w,h)/2 - inset` where inset ≈ `strokeWidth + 2` (or ~4% of short side). Stroke only (no fill), same color family as slice (high alpha).
- **Why:** Circle verifies circularity/aspect on LED modules; thin cross verifies axes without eating the caro.
- **Alternatives considered:** Concentric multi-rings (clutter); circle diameter = diagonal (extends outside slice).

### 4. Label plates
- **Choice:** Before drawing text, fill a rounded (or sharp) rectangle behind the label block: dark semi-opaque fill (`rgba(0,0,0,0.55)`) plus a 1px light/colored border. Size from measured text metrics + padding. Keep existing text stroke as secondary contrast.
- **Why:** “Slight borders around the text” + readability on caro without huge UI chrome.
- **Alternatives considered:** Text-only thicker halo (weaker); full-width banner (heavy).

### 5. Guide animation
- **Choice:** When `animation.enabled`, drive guides from the same `sliceAnimPhase(time, period, index)`:
  - **phase-scroll:** circle uses `setLineDash` with dash offset traveling around the circumference; cross lines use dashed strokes with traveling offset along each axis
  - **pulse:** circle radius scales ±~6% around base; cross stroke alpha/width pulses (labels stay static)
- Static look at `t=0` / animation off: solid strokes, base radius (no dash motion).
- **Why:** User explicitly wants lines + circle animated for video wall tests; reuses existing animation plumbing.
- **Alternatives considered:** Only pulse fill (status quo); spinning full circle rotation (harder to read as a circle).

### 6. Interaction with existing `cross` design
- **Choice:** Keep `cross` as the thick Mapping Guru bar fill. Professional thin guides are the RasterVideo overlay layer. Document in UI: design = fill; guides = geometry overlays.
- **Why:** No **BREAKING** removal of the design enum; clearest mental model.

### 7. Persistence
- **Choice:** Nested `export.guides` with defaults on; missing keys → enabled + all show* true. Keep `version: 1`.
- **Why:** Additive; old projects gain the pro look automatically (acceptable; matches “rework the design”). If too aggressive, default `enabled: true` only for new projects—**lean: default on for everyone** since this is an intentional visual upgrade.

## Risks / Trade-offs

- **[Risk] Double-cross when design=`cross` and showCross** → Auto-suppress overlay cross when design is `cross`, or leave showCross user-toggleable (default off only in that case).
- **[Risk] Label plate covers caro center** → Keep plate compact to text bounds; circle still visible around it.
- **[Risk] Dashed animation looks noisy on tiny slices** → Increase dash length with size; fall back to pulse-only below a size threshold.
- **[Trade-off] Always-on pro overlays change PNG look for existing users** → Intentional upgrade; toggle `guides.enabled` to revert closer to old outline-only.

## Migration Plan

- Load: missing `guides` → defaults (enabled, showCross, showCircle, showLabelPlate).
- Save: write `export.guides`.
- No schema version bump.

## Open Questions

- Exact dash lengths / pulse amplitude (tune in implementation against a 400×270 and a 1920×1080 panel).
- Whether inner double-frame is always on or tied to `guides.enabled` (lean: tied).
- Default `showCross` when design=`cross` (lean: force overlay cross off in draw path regardless of flag).
