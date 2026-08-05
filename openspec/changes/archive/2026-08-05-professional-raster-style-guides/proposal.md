## Why

Slice fills (especially caro) already read well as LED input-map guides, but the overall look still feels “app UI” rather than a professional raster/test-pattern tool: thin outlines, no center circle, and labels that wash out on busy checkers. Operators want a RasterVideo-style panel—clear frame, center circle + axis guides, and readable labeled plates—so geometry, aspect, and mapping errors jump out on real walls. Animating those guides in the exported video makes the test pattern even easier to verify under Resolume playback.

## What Changes

- Add **professional geometry overlays** on every slice (composition-wide, on top of the chosen fill design):
  - Stronger **slice outline / frame** (RasterVideo-style clear border)
  - **Center cross guides** (H+V through slice center, edge-to-edge)
  - **Inscribed center circle** (fits within the slice short side / inset from edges)
- Improve **on-slice labels** with a slight **bordered plate / halo** behind text so names and dimensions stay readable on caro
- Keep existing fill designs (`simple` / `caro` / `cross`); overlays complement them (caro remains the preferred “pro” fill)
- When animation is enabled (preview + MP4 export), **animate the cross lines and center circle** (not only the fill/pattern)—e.g. dash travel, radius pulse, or phase-synced stroke emphasis—so wall tests catch dead pixels and mapping issues faster
- Persist any new guide/label visual options with safe defaults for older projects

## Capabilities

### New Capabilities
- `slice-geometry-guides`: Composition-wide RasterVideo-style overlays—frame outline, center cross, and inscribed circle—drawn on every slice in editor, PNG, and video
- `slice-label-plates`: Bordered/background plate behind on-slice label text for readability on busy fills
- `guide-animation`: Time-based animation of geometry guides (cross + circle) in preview and video export, integrated with existing animation settings

### Modified Capabilities
- (none in main `openspec/specs/` yet; fill designs and existing animation/video stay; this change adds overlays and extends what animates)

## Impact

- Drawing: extend `drawSliceOnContext` (or a shared overlay pass) after fill, before/around labels
- Animation: extend time-parameterized draw so guides respond to phase, not only caro/pulse fills
- Model/UI: optional toggles if we expose “show circle / show cross overlay / label plate” (defaults on for the pro look); otherwise always-on overlays with stroke width already in export settings
- PNG input maps and MP4 wall-test videos both pick up the new look (WYSIWYG)
- Reference look: RasterVideo-style LED test panels as discussed in [r/VIDEOENGINEERING](https://www.reddit.com/r/VIDEOENGINEERING/comments/1l99qmd/rastervideo_tool_for_creating_test_patterns/)
