## Why

Dragging slices is good for rough layout, but LED / Resolume-style mapping needs exact pixel placement. Users should be able to type the slice’s composition offset as first-class slice properties, without relying only on canvas drag (or on thinking in slice centers).

## What Changes

- Expose **Offset X** and **Offset Y** as editable properties of each slice in the inspector (composition pixels from the composition’s top-left origin)
- Offset means the **top-left of the unrotated slice rectangle**; entering offsets updates the slice’s stored center (`cx` / `cy`) so rotation and export stay correct
- Keep canvas drag-and-drop as an equal editing path: dragging updates the same properties, and typing offsets moves the slice on the canvas
- Relabel / replace the current **Center X** / **Center Y** inspector fields with these offset properties so the primary numeric position UI matches “where the slice is placed”
- No project schema version bump: persistence continues to store `cx` / `cy`; offsets are a UI/view of the same geometry

## Capabilities

### New Capabilities
- `slice-offset-properties`: Numeric Offset X / Offset Y slice properties for exact composition placement, kept in sync with canvas move and the existing center-based geometry model

### Modified Capabilities
- (none — main `openspec/specs/` has no synced capabilities yet; this introduces a focused capability on top of existing slice geometry editing)

## Impact

- Primary UI: slice inspector in `App.tsx` (geometry draft fields and labels)
- Small geometry helpers to convert between top-left offset and center (`cx` / `cy`) given width/height
- Canvas drag path unchanged in behavior; it continues to write `cx` / `cy`, which refresh the offset fields
- Persistence, export PNG, and project JSON remain center-based (`cx`, `cy`)
