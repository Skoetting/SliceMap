## Why

Static PNG input maps help place slices in Resolume, but they are hard to verify on real LED walls: dead pixels, wrong aspect, flipped/mirrored output, and slice identity are easy to miss when nothing moves. Animated test patterns—and a Resolume-friendly video export—make mapping and wall health checks far more obvious before a show.

## What Changes

- Add **animated test-pattern modes** that move or pulse the chosen slice design (simple / caro / cross) so pattern edges, checker phase, and slice identity are easier to spot on physical walls
- Show the same animation live in the **editor preview** so operators can judge timing and readability before export
- Add **video export** at composition resolution (e.g. WebM/MP4 suitable for drag-into Resolume Arena as media), looping cleanly for continuous wall tests
- Keep existing **PNG export** for Advanced Output “Load Input Map”; video is an additional path for content/verification, not a replacement for the static map
- Persist animation-related export settings (enabled, style, fps/duration where applicable) in project JSON with safe defaults for older projects

## Capabilities

### New Capabilities
- `test-pattern-animation`: Time-based animation of slice fill patterns (and related cues) in the editor preview, driven by composition-level settings
- `video-export`: Export the composition (slices + chosen design + animation) as a video file at composition pixel size for use in Resolume

### Modified Capabilities
- (none — main `openspec/specs/` has no synced capabilities yet; PNG export and slice design stay as today)

## Impact

- Drawing: extend slice render path to accept a time/phase parameter so caro/cross/simple can animate consistently in preview and frame-by-frame video encode
- Model: export/composition settings gain animation + video options (fps, duration/loop length, animation style)
- Persistence: load/save new fields with defaults; older projects remain valid
- UI: controls to enable/preview animation and trigger video download alongside PNG export
- Dependencies: browser MediaRecorder and/or a small encode path (canvas → video blob); no server required
- Resolume workflow: PNG remains for Input Map; video is dropped on a layer/clip to visually stress-test mapped walls
