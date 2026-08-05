## Why

Operators often want glowing or scanning outline looks on LED walls using stock Resolume effects (e.g. Radar) rather than third-party plugins. That workflow needs a clean **frame** texture per slice—border only, transparent interior—sized to the slice. Building those by hand in Photoshop for every panel is slow; SliceMap already knows each slice’s size and can emit them in one click.

## What Changes

- Add a **frame border size** (px) setting for per-slice frame exports (separate from the input-map outline stroke where useful, or clearly labeled if shared)
- Add **Export frames** that generates one PNG per slice: slice width×height, transparent inside, opaque rectangular border of the chosen thickness
- Download as individual files or a single zip when there are multiple slices
- Document Resolume usage: drop a frame on a layer / use with Radar (and similar) for outline-style looks without plugins
- Keep existing composition PNG and MP4 exports unchanged

## Capabilities

### New Capabilities
- `slice-frame-export`: Configure border thickness and export per-slice hollow-frame PNGs for use as clip media / effect sources in Resolume

### Modified Capabilities
- (none — composition input-map PNG and video export requirements stay as-is)

## Impact

- New export path alongside Export PNG / Export video
- Project `export` settings (border size for frames) + persistence / defaults
- UI control + help text for the Radar / outline workflow
- Possible lightweight zip helper for multi-file download (browser-side)
- No Resolume plugin dependency; frames are plain PNGs
