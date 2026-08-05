## Why

Many shows already have a finished Resolume Advanced Output screen setup. Rebuilding those slices by hand in SliceMap just to export a matching test-pattern video is slow and error-prone. Importing the saved Advanced Output XML lets operators reuse the existing mapping and generate PNG/MP4 test patterns that already match their stage.

## What Changes

- Add **Import Advanced Output XML** (file picker) for Resolume Arena/Avenue screen-setup preset `.xml` files
- Parse composition size (when available) and **input-rect slices** into the SliceMap project model (`cx`/`cy`/`width`/`height`/`rotationDeg`/`name`)
- Replace or merge into the current project with clear confirmation when slices already exist
- Surface parse errors for unsupported/corrupt XML; document that the format is unofficial and may change across Resolume versions
- Keep existing JSON load/save and PNG/MP4 export unchanged—XML import is an inbound convenience path
- **Out of scope:** writing/exporting Advanced Output XML back to Resolume; full bezier/homography warps as editable polygons; live OSC/REST control of a running Resolume instance

## Capabilities

### New Capabilities
- `resolume-xml-import`: Load a Resolume Advanced Output (screen setup) XML preset and map rectangular input slices into a SliceMap project for preview and test-pattern export

### Modified Capabilities
- (none — existing `video-export` / animation / guides requirements stay; this feeds the same project model)

## Impact

- New parser module for screen-setup XML → `SliceMapProject` fields
- UI: Import XML control next to Load JSON; help text for Documents → Resolume → presets/screensetup path
- Geometry: derive AABB/center/size/rotation from `InputRect` (and related) vertices; skip or warn on non-rectangular / heavily warped slices in v1
- No new runtime dependencies beyond browser `DOMParser`
- Risk accepted: Resolume’s XML is undocumented and may change without notice ([Resolume forum guidance](https://www.resolume.com/forum/viewtopic.php?t=28541))
