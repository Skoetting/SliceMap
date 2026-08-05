## Why

Dragging slices on the editor preview is freeform, so aligning edges to the composition border or to neighboring slices takes careful pixel hunting. Soft magnetic snap would make tidy layouts faster without forcing positions—users can still place a slice anywhere by moving past the snap zone.

## What Changes

- While moving a slice on the editor canvas, edges (and optionally centers) gently snap when they come within a small threshold of:
  - the composition borders (and optionally the composition midlines)
  - edges of other slices
- Snap is assistive only: it does not lock the slice, block free placement, or change resize/rotate behavior in this change
- Leaving the snap threshold (or continuing to drag past it) restores free positioning so the user can place slices exactly where they want
- No change to project schema, persistence, or PNG export geometry beyond the positions the user already chooses via drag

## Capabilities

### New Capabilities
- `slice-magnetic-snap`: Assistive magnetic snapping while dragging slices on the editor preview, against composition borders and other slice edges, without preventing free placement

### Modified Capabilities
- (none — main `openspec/specs/` has no synced capabilities yet; this introduces snap as a focused capability on top of existing canvas move behavior)

## Impact

- Primary UI: `EditorCanvas` pointer move path for `move` drag mode
- Likely new pure geometry helpers for snap candidates / threshold resolution (composition bounds + other slices)
- No API, persistence, or export format changes
- Resize and rotate remain unaffected unless explicitly extended later
