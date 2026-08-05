## 1. Model & persistence

- [x] 1.1 Add `frameBorderPx` to `ExportSettings` with default (12) and clamp helper (positive int, sensible max)
- [x] 1.2 Parse/serialize `frameBorderPx` in persistence with default for legacy projects; extend round-trip verify

## 2. Frame PNG generation

- [x] 2.1 Create `src/model/exportFrames.ts` that renders each slice as width×height PNG (transparent interior, opaque white border fully inside bounds)
- [x] 2.2 Clamp border per slice when too thick; collect clamp warnings for status
- [x] 2.3 Sanitize slice names into unique filenames (`frame-<name>.png` with collision suffixes)

## 3. Download packaging

- [x] 3.1 Single-slice export downloads one PNG
- [x] 3.2 Multi-slice export packs PNGs into one zip (minimal in-browser zip or small dependency) and triggers download
- [x] 3.3 Guard empty project: no download + clear status when there are no slices

## 4. UI & docs

- [x] 4.1 Add Frame border (px) control and **Export frames** button near other exports
- [x] 4.2 Status feedback: exported count, zip vs single file, clamp warnings
- [x] 4.3 Document in README/help: use frames with Radar (etc.) for outline looks; not a substitute for Load Input Map PNG
