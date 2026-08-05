## 1. Snap geometry helpers

- [x] 1.1 Add `src/model/snap.ts` with AABB helpers from slice corners (min/max X/Y)
- [x] 1.2 Implement guide collection: composition borders (+ midlines) and other slices’ AABB edges
- [x] 1.3 Implement `applyMoveSnap` that nudges proposed `cx`/`cy` when an edge is within threshold; resolve X and Y independently (closest delta wins); return active guides
- [x] 1.4 Add unit tests for border snap, neighbor edge snap, no-snap outside threshold, and dual-axis corner snap

## 2. Editor canvas integration

- [x] 2.1 In `EditorCanvas` move drag path, convert screen snap threshold (~10px) to world units via current scale and call `applyMoveSnap` before `onUpdateSlice`
- [x] 2.2 Optionally bypass snap while Alt is held during move
- [x] 2.3 Ensure resize and rotate paths remain unchanged (no snap)

## 3. Visual feedback

- [x] 3.1 Track active snap guides during move and clear them on pointer up / when no snap applies
- [x] 3.2 Draw temporary horizontal/vertical guide lines on the editor canvas while snap is active

## 4. Verify

- [x] 4.1 Manually verify: snap to composition edges, snap to another slice, escape by dragging past threshold, free placement still works
- [x] 4.2 Confirm zoom levels keep on-screen magnet feel roughly consistent
- [x] 4.3 Run tests / `npm run build` to confirm no regressions
