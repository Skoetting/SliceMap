## 1. Model and persistence

- [x] 1.1 Add `SliceDesign` type (`'simple' | 'caro' | 'cross'`) and `design` field on `ExportSettings`; default `'simple'` in `createDefaultProject`
- [x] 1.2 Add `showDimensions: boolean` to `ExportSettings`; default `true` in `createDefaultProject`
- [x] 1.3 Update persistence load/save to read/write `design` and `showDimensions` with legacy defaults (`simple`, `true`) and unknown-design fallback
- [x] 1.4 Extend round-trip / model verification to cover design + showDimensions

## 2. Slice drawing

- [x] 2.1 Extend `drawSliceOnContext` to accept composition `design`; keep current fill+outline for `simple`
- [x] 2.2 Implement `caro` checkerboard fill spanning the full slice rect (slice-local, clipped), using slice color alphas
- [x] 2.3 Implement `cross` full-slice + (edge-to-edge through center) with thickness tied to stroke/slice size, plus outline
- [x] 2.4 Gate dimension label line on `showDimensions` (name always when labels are shown); thread design + flag from editor + export callers

## 3. Inspector UI

- [x] 3.1 Add design control (select or segmented) near composition/export controls; wire to `project.export.design`
- [x] 3.2 Add “Show dimensions” checkbox near export/outline controls; wire to `project.export.showDimensions`
- [x] 3.3 Confirm editor canvas redraws when design or showDimensions changes

## 4. Verification

- [ ] 4.1 Manually verify: simple / caro / cross on rotated slices in editor and PNG export match (all slices share design)
- [x] 4.2 Manually verify: toggle show dimensions off/on updates preview labels and exported PNG; save/load preserves both settings
- [x] 4.3 Manually verify: loading an older project without the new fields looks like simple + dimensions on
