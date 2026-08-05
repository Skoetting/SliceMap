## Context

SliceMap’s editor canvas (`EditorCanvas`) already supports pointer-driven move, resize, and rotate. Move currently applies a raw world delta to `cx`/`cy` with no alignment aids. Users assembling Resolume input maps often want edges flush with the composition border or abutting another slice, but still need arbitrary placement when slices intentionally overhang or leave gaps.

This change adds soft magnetic snap only during **move** drags. Geometry stays center-based (`cx`, `cy`, `width`, `height`, `rotationDeg`); snap adjusts the proposed center after the free delta is computed.

## Goals / Non-Goals

**Goals:**
- Assistive edge snap while dragging a slice on the editor preview
- Snap targets: composition borders and edges of other slices
- Soft threshold behavior: snaps when close, releases when the pointer moves far enough that free placement is intended
- Keep move feel responsive; snap logic stays a pure helper callable from the existing pointer-move path

**Non-Goals:**
- Hard locking, grid-only placement, or preventing positions outside snap targets
- Snap during resize or rotate (can be a follow-up)
- Changing project JSON / persistence / PNG export formats
- Mandatory UI toggle or preferences panel (optional modifier to temporarily disable snap is acceptable if cheap)
- Full Figma-style spacing equalizers or distribution magnets

## Decisions

### 1. Apply snap only in move mode
- **Choice:** Hook snap into the `drag.mode.kind === 'move'` branch after computing the free `cx`/`cy` from the pointer delta.
- **Why:** Matches the request (drag positioning). Resize/rotate magnets are a different interaction model.
- **Alternatives considered:** Snap on all drag modes (out of scope); snap only on pointer-up (feels less “magnetic” while dragging).

### 2. Axis-aligned edge guides (AABB)
- **Choice:** Build horizontal and vertical guide lines from:
  - composition: `x = 0`, `x = width`, `y = 0`, `y = height`
  - every other slice: min/max X and Y of its world corners (`getSliceCorners`)
- For the moving slice, compute its current AABB from a candidate pose (`cx`/`cy` with existing size/rotation), then nudge `cx` and/or `cy` so the nearest AABB edge aligns to a guide when within threshold.
- **Why:** Works for both axis-aligned and rotated slices with one code path; reuses existing corner math; gives a clear magnet to borders and neighbors.
- **Alternatives considered:** Snap only when `rotationDeg === 0` (simpler but weaker for rotated panels); snap true OBB edge midpoints (more accurate for rotated abutting, much more complex for v1).

### 3. Soft threshold in screen space
- **Choice:** Use a fixed on-screen snap radius (e.g. ~8–12 CSS pixels), converted to composition units via the current canvas scale (`thresholdWorld = thresholdScreen / scale`).
- **Why:** Magnet feel stays consistent at Fit / 25% / 50% / 100% zoom; a fixed composition-pixel threshold would feel huge when zoomed out and tiny when zoomed in.
- **Alternatives considered:** Fixed composition pixels (simpler, worse UX across zoom); adaptive threshold by slice size (unnecessary for v1).

### 4. Independent X/Y snap, closest guide wins
- **Choice:** Resolve X and Y separately. For each axis, among guides within threshold of any relevant moving edge (left/right for X, top/bottom for Y), pick the smallest absolute delta and apply that single nudge to `cx` or `cy`.
- **Why:** Allows corner snaps (border + neighbor) without fighting multiple guides on the same axis; leaving the threshold restores free motion on that axis immediately—no sticky lock.
- **Alternatives considered:** Sticky hysteresis (enter at 12px, leave at 20px)—slightly nicer escape, more state; multi-guide blending—unpredictable.

### 5. Pure helper module, thin canvas integration
- **Choice:** Add something like `src/model/snap.ts` with `applyMoveSnap({ moving, others, composition, proposedCx, proposedCy, threshold }) → { cx, cy }` (and optionally which guides snapped for drawing). Call it from `EditorCanvas` move handling.
- **Why:** Keeps geometry testable without React; mirrors `overlap.ts` / `geometry.ts` patterns.
- **Alternatives considered:** Inline snap in the component (harder to unit-test).

### 6. Optional snap guide lines while active
- **Choice:** When a snap is applied, draw a light temporary guide line on the editor canvas for the active vertical and/or horizontal guide(s).
- **Why:** Makes the magnet feel intentional and teaches the user what they aligned to; low cost if the helper returns active guides.
- **Alternatives considered:** Snap with no visuals (subtler but harder to trust); permanent alignment overlays (clutter).

### 7. Escape / override
- **Choice:** Default escape is distance > threshold (no snap applied). Optionally hold **Alt** during drag to bypass snap entirely if easy to wire in the pointer handler.
- **Why:** Satisfies “support, don’t prevent” without a settings UI.
- **Alternatives considered:** Always-on snap with no override (usually enough); settings toggle (overkill for v1).

## Risks / Trade-offs

- [Rotated slices snap AABB, not true panel edges] → Document as v1; axis-aligned maps (common Resolume case) feel exact; follow-up can add OBB edge magnets if needed.
- [Dense layouts produce many guides; wrong edge wins] → Closest-delta-wins per axis; keep threshold modest (~8–12px screen).
- [Snap fights intentional near-miss placement] → Soft threshold + Alt bypass; no snap on release-only so users can fine-tune by moving slightly away.
- [Guide drawing adds canvas complexity] → Keep guides ephemeral and only during active move snap; skip if time-boxed and ship math-only first.

## Migration Plan

- No data migration; behavior is editor-only at drag time.
- Rollback: remove snap call from move handler (and optional guide draw); positions already stored remain valid.

## Open Questions

- Exact screen-pixel threshold (default proposal: **10px**)—tune after trying on a real layout.
- Whether composition **center** midlines (`width/2`, `height/2`) should be guides in v1 (lean **yes**—cheap and useful for centering).
- Whether Alt-to-disable is required for first ship (lean **include if trivial**, else defer).
