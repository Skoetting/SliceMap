## ADDED Requirements

### Requirement: Magnetic snap while moving slices
The system SHALL apply soft magnetic snap to a slice’s position while the user drags it on the editor canvas (move interaction). Snap MUST adjust the slice center so that an axis-aligned edge of the moving slice aligns with a snap target when within the snap threshold. Snap MUST NOT prevent the user from placing the slice at a non-aligned position by continuing the drag beyond the threshold (or using an explicit bypass if provided).

#### Scenario: Snap to composition border
- **WHEN** the user drags a slice so one of its edges comes within the snap threshold of a composition border
- **THEN** the slice position snaps so that edge aligns with that border for as long as the drag remains within the threshold

#### Scenario: Snap to another slice edge
- **WHEN** the user drags a slice so one of its edges comes within the snap threshold of another slice’s corresponding axis-aligned edge
- **THEN** the slice position snaps so those edges align for as long as the drag remains within the threshold

#### Scenario: Free placement outside threshold
- **WHEN** the user drags a slice such that no snap target is within the snap threshold of its edges
- **THEN** the slice follows the pointer freely with no snap offset applied

#### Scenario: Escape after snapping
- **WHEN** a slice is currently snapped to a target and the user continues dragging so the would-be free position leaves the snap threshold
- **THEN** the snap releases and the slice resumes free positioning

### Requirement: Snap targets and threshold
The system SHALL treat composition borders as snap targets and SHALL treat axis-aligned bounding edges of other slices as snap targets. The snap threshold MUST be based on on-screen distance (not a fixed composition-pixel distance alone) so magnet feel remains usable across editor zoom levels.

#### Scenario: Threshold scales with zoom
- **WHEN** the editor zoom changes and the user drags a slice near a snap target
- **THEN** the on-screen distance that triggers snap remains approximately consistent with the configured screen-pixel threshold

#### Scenario: Independent horizontal and vertical snap
- **WHEN** a drag brings the slice near both a vertical guide and a horizontal guide within threshold
- **THEN** the system MAY snap on both axes at once (e.g. into a corner) without blocking further drag

### Requirement: Move-only assistive behavior
Magnetic snap SHALL apply during canvas move drags. Resize and rotate interactions MUST continue to work without magnetic snap from this capability. Snap MUST NOT change saved project schema or block export/save of any resulting geometry.

#### Scenario: Resize unaffected
- **WHEN** the user resizes a slice via handles
- **THEN** the resize updates size/position without applying magnetic snap from this capability

#### Scenario: Rotate unaffected
- **WHEN** the user rotates a slice via the rotate handle
- **THEN** rotation updates without applying magnetic snap from this capability

### Requirement: Snap feedback (optional guide)
When a snap is actively applied during a move drag, the system SHOULD show a temporary visual guide for the active snap line(s) on the editor canvas so the user can see what they aligned to. Guides MUST disappear when the drag ends or when snap is not active.

#### Scenario: Guide while snapped
- **WHEN** a move drag is actively snapped to a vertical or horizontal target
- **THEN** the editor shows a temporary guide along that target while the snap remains active
