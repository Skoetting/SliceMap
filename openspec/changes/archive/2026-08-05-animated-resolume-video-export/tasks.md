## 1. Model and persistence

- [x] 1.1 Add `export.animation` settings (`enabled`, `style: 'phase-scroll' | 'pulse'`, `periodSec`) and `export.video` (`fps`) to types with defaults (`enabled: false`, `phase-scroll`, `4`, `fps: 30`)
- [x] 1.2 Update persistence load/save for animation/video fields with legacy defaults and clamps (period > 0, fps 15–60)
- [x] 1.3 Extend round-trip / model verification for the new fields

## 2. Time-based drawing

- [x] 2.1 Extend `drawSliceOnContext` / `renderExportCanvas` with `timeSec` and optional slice index for phase offset; `t = 0` / animation off matches today’s static look
- [x] 2.2 Implement caro phase-scroll (checker phase shift) and pulse modulation for fill/pattern alphas; keep outlines/labels static and readable
- [x] 2.3 Apply per-slice phase offset from slice order so adjacent slices are not lockstep

## 3. Editor preview

- [x] 3.1 Drive `requestAnimationFrame` in `EditorCanvas` when animation is enabled; pass elapsed time into the shared draw path; stop on disable/unmount
- [x] 3.2 Ensure editing interactions still work while the preview animates; redraw when animation settings change

## 4. Video export

- [x] 4.1 Implement frame loop: black plate + slices at `t = i / fps` for one `periodSec` loop; seamless phase at loop boundary
- [x] 4.2 Encode via `captureStream` + `MediaRecorder` (WebM); download `{name}-test-pattern.webm`
- [x] 4.3 Surface encode progress in status and clear errors when codec/MediaRecorder unsupported
- [x] 4.4 Confirm PNG export path remains unchanged (transparent static map)

## 5. UI

- [x] 5.1 Add Animate toggle, style select, period (seconds), and fps controls near existing export/design settings
- [x] 5.2 Add **Export video** button beside **Export PNG**; wire empty-project confirm similar to PNG if needed
- [x] 5.3 Brief help/status copy noting video is for Resolume media/wall tests; PNG remains for Load Input Map

## 6. Verification

- [x] 6.1 Manually verify: preview animation for caro phase-scroll and pulse; adjacent slices show different phase
- [x] 6.2 Manually verify: exported WebM loops cleanly in a player / Resolume; dimensions match composition; black background
- [x] 6.3 Manually verify: animation off → static preview; legacy JSON loads with animation disabled; PNG export still works
