## 1. Sample fixture & parsing foundation

- [x] 1.1 Add at least one anonymized Resolume screen-setup XML fixture under `src/` or `fixtures/` (or document how to obtain one) for parser development
- [x] 1.2 Create `src/model/importResolumeXml.ts` with `parseResolumeScreenSetupXml(xmlText) → { composition?, slices, skippedCount, warnings }`
- [x] 1.3 Detect ScreenSetup / Screen / InputRect (or equivalent) nodes defensively; fail with a clear error for unrecognized roots
- [x] 1.4 Convert rectangular InputRect quads (and orientation when present) into SliceMap `cx/cy/width/height/rotationDeg/name`; skip non-rectangles and count them
- [x] 1.5 Resolve composition size from preset attributes or infer from imported input bounds; surface warnings when inferred or kept

## 2. Geometry helpers & tests

- [x] 2.1 Add helpers to test “is rectangle,” extract AABB/center/size/rotation from four vertices with numeric tolerance
- [x] 2.2 Add a small Node/Vite test or script (`verify:resolume-xml` or unit tests) covering axis-aligned, rotated, skip-warped, and invalid XML cases
- [x] 2.3 Assign new ids via `createId()` and cycle `DEFAULT_COLORS` for imported slices

## 3. Editor integration

- [x] 3.1 Add **Import XML** control next to Load JSON with `.xml` file input
- [x] 3.2 On load: parse file; if project has slices, confirm replace; then apply composition + slices to project state
- [x] 3.3 Show status summarizing imported vs skipped counts, composition size source, and parse errors without mutating project on failure
- [x] 3.4 Verify PNG and MP4 export still work after a successful import

## 4. Docs & polish

- [x] 4.1 Document in README/help where Resolume stores `presets/screensetup` XML and that the format is unofficial / best-effort
- [x] 4.2 Note limitations: no XML export, non-rectangular / soft-edge slices skipped
