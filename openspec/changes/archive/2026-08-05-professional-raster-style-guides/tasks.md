## 1. Model and persistence

- [x] 1.1 Add `export.guides` settings (`enabled`, `showCross`, `showCircle`, `showLabelPlate`) with defaults all `true`
- [x] 1.2 Persist/load guides with legacy defaults; extend round-trip verification

## 2. Geometry overlays

- [x] 2.1 Draw strong outer frame (+ optional thin inner frame) when guides enabled
- [x] 2.2 Draw inscribed center circle (stroke-only, inset from short side) when `showCircle`
- [x] 2.3 Draw thin edge-to-edge center cross when `showCross`; suppress redundant overlay when design is `cross`
- [x] 2.4 Keep fill designs (simple/caro/cross) underneath; shared path for editor / PNG / video

## 3. Label plates

- [x] 3.1 Measure label text block and draw semi-opaque bordered plate behind name (± dimensions)
- [x] 3.2 Gate plate on `showLabelPlate`; respect existing `showDimensions` content rules

## 4. Guide animation

- [x] 4.1 Phase-scroll: traveling dashes on circle and cross from `sliceAnimPhase`
- [x] 4.2 Pulse: circle radius / stroke emphasis pulse; keep labels static
- [x] 4.3 Confirm preview RAF and MP4 frames both animate guides when animation is enabled; static when off

## 5. UI

- [x] 5.1 Add composition controls for guides enabled / show circle / show cross / label plate near design settings
- [x] 5.2 Short hint that guides are RasterVideo-style overlays; fill design remains separate

## 6. Verification

- [x] 6.1 Manually verify caro + frame + circle + label plate in editor and PNG
- [x] 6.2 Manually verify animated dashes/pulse on circle+cross in preview and exported MP4
- [x] 6.3 Manually verify guides off / design=cross no double-cross / legacy JSON loads with guides on
