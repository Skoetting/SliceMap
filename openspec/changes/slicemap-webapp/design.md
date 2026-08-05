## Context

SliceMap is a greenfield static webapp in this repository. The product is an input-map designer for Resolume Arena VJs: arrange rotatable rectangular slices on a composition canvas, then export a PNG used via Advanced Output → **Load Input Map**. Persistence is JSON download/upload so layouts can be shared without a backend. Hosting target is free GitHub Pages.

Primary user is the author; the app should also be usable by other VJs who open the public URL.

## Goals / Non-Goals

**Goals:**
- Browser-only editor for composition size + rectangular slices (x, y, w, h, rotation, name, color)
- Pleasant create/edit UX: canvas interaction + numeric inspector
- Soft overlap warnings without blocking overlaps
- Pixel-accurate PNG export suitable as a Resolume input-map guide (transparent background, outlines, labels)
- JSON project save/load
- Static deploy to GitHub Pages

**Non-Goals:**
- Resolume Advanced Output XML export (next iteration)
- Logo overlays, output/processor packing maps
- Polygons, masks, fixtures, LED strips
- Accounts, cloud sync, or any server API
- Live integration with a running Resolume instance

## Decisions

### 1. Stack: Vite + TypeScript + React
- **Choice:** Vite SPA with TypeScript and React.
- **Why:** Fast local DX, simple static build for GitHub Pages, strong canvas/UI ecosystem. TypeScript helps keep the slice/project model honest.
- **Alternatives considered:** Vanilla TS (lighter but more UI boilerplate); Svelte (fine, less familiar default). React chosen for speed of building inspector + canvas chrome.

### 2. Rendering: dual canvas roles
- **Editor canvas:** HTML Canvas (or SVG overlay for handles) showing the composition, slices, selection chrome, and overlap hints. Viewport may scale to fit the UI while the model stays in composition pixels.
- **Export canvas:** Off-screen canvas at exact composition resolution for PNG download (independent of UI zoom).
- **Why:** Separates “edit comfortably” from “export 1:1 pixels,” which Resolume requires for Load Input Map (native resolution, top-left placement).

### 3. Coordinate model
- Origin top-left; units = composition pixels.
- Slice stored as center or top-left + size + rotation degrees — **decision: store `x, y` as top-left of the unrotated rectangle’s bounding box before rotation, OR as center + w/h + rotation**. Prefer **center-based** (`cx`, `cy`, `width`, `height`, `rotationDeg`) for clean rotation around slice center (matches Resolume mental model when rotating panels).
- Export and hit-testing use the same transform: translate → rotate → draw rect.

### 4. Overlap detection
- Use oriented bounding box (OBB) intersection (separating-axis or polygon intersection of the four corners).
- v1 may approximate with AABB of rotated corners if OBB proves heavy — still better than ignoring rotation. Prefer real OBB for correctness with rotated LED panels.
- UI: non-blocking banner or badge (“2 slices overlap”) listing names; never prevent save/export.

### 5. PNG visual language (Load Input Map)
- Fully transparent background.
- Semi-transparent fills (slice color at low alpha) so guides remain readable under Resolume’s opacity slider.
- Opaque or high-contrast outlines; configurable stroke thickness (default ~2–4 px at comp scale).
- Labels inside or near each slice: **name** and **W×H** (enough to verify zoom/aspect). Rotation angle optional on PNG if space allows; not required for v1 labels.
- No logo.

### 6. Project JSON schema
Minimal versioned document, e.g.:
```json
{
  "version": 1,
  "name": "my-show",
  "composition": { "width": 1920, "height": 1080 },
  "slices": [
    {
      "id": "uuid",
      "name": "Center",
      "cx": 960,
      "cy": 540,
      "width": 960,
      "height": 540,
      "rotationDeg": 0,
      "color": "#3B82F6"
    }
  ],
  "export": { "strokeWidth": 3 }
}
```
- Save = download file; Load = file picker. Optional `localStorage` autosave is nice-to-have, not required for v1.

### 7. Hosting
- GitHub Actions (or `peaceiris/actions-gh-pages` / native Pages from Actions) builds `vite build` and publishes `dist/`.
- Base path configurable for project Pages (`/repo-name/`) vs user Pages.
- App title/branding: **SliceMap**.

### 8. Deferred: XML export
- Document as follow-up change. Approach later: reverse-engineer a minimal Arena Advanced Output preset with rectangular slices and emit XML from the same project model. No XML work in this change.

## Risks / Trade-offs

- **[Risk] Large compositions (4K+) make the editor canvas heavy** → Mitigate with UI scaling (draw scaled; export full-res only on demand).
- **[Risk] Label clutter on small slices** → Mitigate with minimum font size, truncate names, or hide labels below a size threshold on export.
- **[Risk] Rotation UX is fiddly** → Mitigate with rotate handle + numeric field; snap to 15° optional later.
- **[Risk] Resolume guide placement assumes native PNG size** → Mitigate by always exporting at exact composition W×H and documenting the Load Input Map workflow in the UI/README.
- **[Trade-off] No XML in v1** → Users still recreate slices in Arena manually; PNG remains the verification/guide artifact. Acceptable per product decision.

## Migration Plan

- N/A for users (new app).
- Deploy: push to `main` → Actions → GitHub Pages.
- Rollback: revert deploy commit / previous Pages artifact.

## Open Questions

- Exact default color palette / dark vs light app chrome (product polish; not blocking).
- Whether v1 includes optional 8px snap grid (Resolume LED convention) — useful but not required for first ship.
