## Why

Input maps are more useful on stage when slice fill patterns match what VJs expect from tools like Mapping Guru—checkered (“caro”) or full-slice cross guides—not only a flat tint. Today every slice draws the same simple fill, and dimension text is always baked into labels. Users need a composition-wide visual style and optionally show or hide slice dimensions on labels.

## What Changes

- Add a **composition-wide design / fill pattern** choice applied to all slices, with at least three options:
  - **Simple** — current look: semi-transparent fill + outline (default; preserves existing projects)
  - **Caro** — typical checkered / karo pattern spanning each slice’s interior
  - **Cross** — a cross spanning each whole slice (Mapping Guru–style alignment guide)
- Editor preview and PNG export MUST use the same chosen design for every slice
- Add a configurable option to **include slice dimensions** (`W×H`) in the on-slice label text; when off, labels show identity text without dimensions
- Persist design and label options in the project JSON (export/composition settings) so save/load and export stay consistent
- UI to choose the design and toggle dimension labels at the project/composition level (not per slice)

## Capabilities

### New Capabilities
- `slice-visual-design`: Composition-wide fill patterns (simple, caro, cross) drawn on every slice consistently in the editor and on PNG export
- `slice-label-options`: Configurable on-slice label content, specifically optional inclusion of slice dimensions

### Modified Capabilities
- (none — main `openspec/specs/` has no synced capabilities yet; these are focused add-ons on top of existing slice draw/export behavior)

## Impact

- Model: export/composition settings gain a design/pattern field and a show-dimensions flag (not on individual slices)
- Persistence: load/save must accept new fields with safe defaults for older projects (**non-breaking** for existing JSON)
- Drawing: `drawSliceOnContext` / export path must render caro and cross patterns inside the rotated slice bounds using the project design
- UI: composition/export controls for design + dimension label toggle
- Editor canvas and PNG export share the same drawing rules
