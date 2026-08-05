## 1. Offset conversion helpers

- [x] 1.1 Add `sliceOffset` and `centerFromOffset` helpers in `src/model/geometry.ts` (unrotated top-left ↔ `cx`/`cy` given width/height)
- [x] 1.2 Add a small script or extend an existing model test script to assert round-trip conversion for a few sizes (including odd dimensions)

## 2. Inspector offset properties

- [x] 2.1 Change `GeomDraft` in `App.tsx` from `cx`/`cy` to `offsetX`/`offsetY` and rebuild the draft from the selected slice via `sliceOffset`
- [x] 2.2 Replace Center X / Center Y labels and inputs with Offset X / Offset Y; on commit, convert through `centerFromOffset` and `updateSlice` with `cx`/`cy`
- [x] 2.3 Keep invalid-input revert behavior (non-finite values restore the last valid derived offsets)

## 3. Sync with canvas and size edits

- [x] 3.1 Confirm drag/`onUpdateSlice` path still refreshes the inspector draft when `cx`/`cy` change (no canvas changes required if draft rebuild deps already cover this)
- [x] 3.2 Confirm width/height commits keep center fixed and that offset fields update to the new unrotated top-left

## 4. Manual verification

- [x] 4.1 Manually verify: type offsets → slice moves; drag slice → offsets update; resize → offsets update; rotated slice offset still means unrotated top-left
