## Context

SliceMap already exports a static PNG at composition resolution for Resolume Arena Advanced Output (“Load Input Map”), and draws slices with a shared path (`drawSliceOnContext`) used by the editor and PNG export. Designs include `simple`, `caro`, and `cross`.

Static maps place slices correctly but are weak for **wall verification**: dead LEDs, wrong orientation, mirrored outputs, and slice mix-ups are much easier to spot when the test pattern **moves**. Operators want the same composition animated in-app and as a **video clip** they can drop into Resolume to stress-test mapped walls—without replacing the PNG input-map workflow.

## Goals / Non-Goals

**Goals:**
- Composition-level animation of the current slice design so motion reveals mapping/wall issues
- Live editor preview of the same animation used for export frames
- Client-side video export at composition width × height, suitable to import as media in Resolume Arena
- Persist animation/video settings with safe defaults for older projects
- Keep PNG export unchanged for Load Input Map

**Non-Goals:**
- Replacing PNG input maps with video (Resolume Load Input Map stays PNG)
- Server-side encoding, cloud render, or ffmpeg CLI dependency
- HAP / ProRes / high-bitrate broadcast codecs in v1
- Audio tracks, multi-layer timelines, or Resolume XML/AVE project export
- Per-slice animation overrides (one composition-wide motion for all slices)
- New static design patterns beyond existing simple/caro/cross
- Real-time Syphon/Spout/NDI streaming from the browser

## Decisions

### 1. Time-parameterized draw path
- **Choice:** Extend `drawSliceOnContext` (and `renderExportCanvas`) with an optional `timeSec` / `phase` argument. At `t = 0` (or animation off), output matches today’s static look. Animation mutates pattern phase (caro scroll), fill/cross alpha (pulse), etc.—not slice geometry.
- **Why:** One WYSIWYG path for editor frames and video encode; no duplicate pattern math.
- **Alternatives considered:** Separate “animated renderer” module (drift risk); CSS/DOM animation (won’t bake into video easily).

### 2. Animation styles (composition-wide)
- **Choice:** Add `export.animation` settings:
  - `enabled: boolean` (default `false`)
  - `style: 'phase-scroll' | 'pulse'` (default `'phase-scroll'`)
  - `periodSec: number` (default `4`) — one full loop length
  - Optional subtle **per-slice phase offset** derived from slice order/index so adjacent slices don’t move in lockstep (easier identity checks on walls)
- **Behavior by design:**
  - **caro + phase-scroll:** checker phase shifts continuously (scroll) over `periodSec`
  - **cross / simple + phase-scroll:** treat as pulse of cross/fill alpha (or a soft brightness cycle) over the period—scroll has little meaning on solid/cross
  - **pulse:** all designs modulate opacity/brightness of the fill/pattern (not outlines/labels) over the period
- **Why:** Two readable styles cover “moving checker” (best for caro) and “breathing” guides; period is the only timing knob most users need.
- **Alternatives considered:** Many Mapping Guru–style effects (wipe, rainbow, noise)—defer; user-authored keyframes—out of scope.

### 3. Editor preview
- **Choice:** When `animation.enabled`, `EditorCanvas` drives `requestAnimationFrame`, passes elapsed time into the shared draw path, and stops the loop when disabled or the component unmounts. Editing (drag/resize) keeps working; animation is paint-only.
- **Why:** Operators validate readability before a long encode.
- **Alternatives considered:** Preview only a scrubber without live loop (worse for “does this read on stage?”); always-on animation (battery/noise for static map work).

### 4. Video encode: WebCodecs H.264 → MP4
- **Choice:** Offscreen/export canvas at composition size (even width/height for H.264); for each frame `t = i / fps` for `fps * periodSec` frames (one seamless loop), encode with `VideoEncoder` (AVC/H.264) and mux with `mp4-muxer` into an MP4. Download as `{name}-test-pattern.mp4`. Default **30 fps**, duration = `periodSec` (one loop).
- **Why:** [Resolume’s supported containers](https://resolume.com/support/en/6/video) include MP4 (not WebM); H.264 is what system players and Arena expect. Seamless loop = phase at end matches start.
- **Alternatives considered:**
  - **MediaRecorder WebM** — rejected; Resolume does not list WebM
  - **ffmpeg.wasm** — heavier; revisit only if WebCodecs H.264 is unavailable on a needed browser
  - **GIF** — Resolume supports it but poor quality for wall tests

### 5. Transparent background vs video
- **Choice:** Video frames use a **solid black background** (not PNG-style full transparency). Slice fills/patterns/labels draw on top as today.
- **Why:** Most video codecs/players mishandle or ignore alpha; black is the standard test-pattern plate and reads clearly on LED walls. PNG export remains transparent for Input Map.
- **Alternatives considered:** Checkerboard plate (clutter with caro); attempt WebM alpha (spotty Resolume support).

### 6. Settings placement & persistence
- **Choice:** Nest under `export`: `animation: { enabled, style, periodSec }` and `video: { fps }` (fps default 30). Missing keys on load → defaults above. Keep `version: 1`.
- **Why:** Additive; older projects stay static; mirrors how `design` / `showDimensions` landed.
- **Alternatives considered:** Schema bump to v2 (unnecessary); top-level `animation` key (either fine; keep with export visual policy).

### 7. UI
- **Choice:** Next to design/export controls: toggle **Animate preview**, style select, period (seconds), fps for export, and **Export video** button beside **Export PNG**. Show brief progress/status while recording (“Encoding frame i/n…”).
- **Why:** Discoverable next to existing Resolume PNG path; status bar already exists in the app.
- **Alternatives considered:** Modal wizard (overkill for one loop encode).

### 8. Empty / edge cases
- **Choice:** Zero slices → allow video of black composition-sized plate (or confirm dialog like PNG). Very large comps (e.g. 8K) → warn that encode may be slow/memory-heavy; still attempt.
- **Why:** Matches PNG empty-project behavior; avoids silent failure.

## Risks / Trade-offs

- **[Risk] WebCodecs / H.264 encode missing (Safari encode gaps)** → Document Chromium/Chrome or Edge as the supported export path; surface a clear error if `VideoEncoder.isConfigSupported` fails.
- **[Risk] Odd composition dimensions** → Round down to even width/height for H.264; letterbox/pad with black when drawing into the even canvas.
- **[Risk] Long encode blocks UI on large comps** → Encode asynchronously with progress; keep period short by default (4s); consider `requestIdleCallback`/chunked `requestData`.
- **[Risk] Non-seamless loop if phase math drifts** → Define phase as ` (t % periodSec) / periodSec ` in `[0,1)`; ensure frame 0 and frame N use equivalent phase.
- **[Trade-off] Black plate on video vs transparent PNG** → Intentional; different Resolume jobs.
- **[Trade-off] No HAP/ProRes** → Fine for test patterns; not show playback masters.

## Migration Plan

- Old projects without animation/video fields load with animation **off** and static draw identical to today.
- New saves write `export.animation` and `export.video`.
- Rollback: older app builds ignore unknown keys; files remain openable.

## Open Questions

- Exact per-slice phase offset formula (lean: `index * 0.15` of period, wrapped)—enough separation without chaos.
- Whether labels should stay static (lean: **yes**—readable names) while only fill/pattern animates.
- Whether to expose fps in UI or only as a constant 30 for v1 (lean: **expose**, clamped 15–60).
