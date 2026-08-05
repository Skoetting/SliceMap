## Why

Resolume Arena VJs need labeled input-map images to load as guides in Advanced Output ("Load Input Map") and verify that content zoom and slice alignment are correct. Commercial plugins like MapperGURU do this inside Resolume, but there is no free, self-hosted web tool the author controls and can share with other VJs via GitHub Pages.

## What Changes

- Introduce **SliceMap**, a lightweight static webapp for designing Resolume Arena **input maps**
- Support rectangular slices with position, size, **rotation**, name, and color
- Provide a canvas + inspector UI to create and modify slices (drag, resize, rotate, numeric fields)
- Soft **overlap hints** when slices intersect (overlaps remain allowed)
- Export a **PNG** at exact composition resolution, optimized for Resolume's Load Input Map (transparent background, clear outlines, slice labels)
- Save and load layouts as **JSON** for reuse and sharing
- Deploy as a static site suitable for **GitHub Pages**
- **Out of scope for this change:** Resolume Advanced Output XML export (planned for a later iteration), logo overlays, output/processor packing maps, polygons/masks, LED strips, cloud sync

## Capabilities

### New Capabilities
- `slice-editor`: Composition canvas and UI for creating, selecting, moving, resizing, rotating, and inspecting rectangular input slices, including overlap hints
- `png-export`: Generate and download a pixel-accurate input-map PNG (outlines + slice info) for use as a Resolume Load Input Map guide
- `project-persistence`: Save and load SliceMap projects as JSON (composition size + slices)

### Modified Capabilities
- _(none — greenfield project)_

## Impact

- Greenfield application in this repository (currently OpenSpec-only)
- New frontend stack and static build/deploy pipeline for GitHub Pages
- No backend or paid services; all generation runs in the browser
- Resolume Arena remains the target consumer of the PNG; XML integration deferred
