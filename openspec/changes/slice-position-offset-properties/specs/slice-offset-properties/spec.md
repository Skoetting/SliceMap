## ADDED Requirements

### Requirement: Slice offset properties for exact placement
The system SHALL expose Offset X and Offset Y as editable properties of the selected slice. Offset X and Offset Y MUST be the top-left corner of the slice’s unrotated rectangle in composition pixels (origin at the composition top-left). Entering offsets MUST update the slice position used for canvas display, persistence, and export.

#### Scenario: Set exact offset via properties
- **WHEN** a slice is selected and the user enters Offset X 120 and Offset Y 80
- **THEN** the slice’s unrotated top-left is at (120, 80) in composition pixels and the canvas shows the slice at that position

#### Scenario: Offset fields reflect current slice
- **WHEN** a slice is selected
- **THEN** the inspector shows Offset X and Offset Y derived from that slice’s current geometry

#### Scenario: Reject invalid offset input
- **WHEN** the user enters a non-finite value for Offset X or Offset Y
- **THEN** the system MUST NOT apply the invalid value and MUST restore the previous valid offset display

### Requirement: Offset properties stay in sync with drag-and-drop
The system SHALL keep Offset X and Offset Y synchronized with canvas move interactions. Dragging a slice MUST update the offset properties; committing new offset values MUST move the slice on the canvas without requiring a separate drag.

#### Scenario: Drag updates offset properties
- **WHEN** the user drags a selected slice to a new location on the canvas
- **THEN** the inspector Offset X and Offset Y update to match the new unrotated top-left position

#### Scenario: Typing offset moves the slice
- **WHEN** the user commits new Offset X / Offset Y values for the selected slice
- **THEN** the slice moves on the editor canvas to that position

### Requirement: Offset editing coexists with size and rotation
Changing width, height, or rotation MUST remain supported. Offset X and Offset Y MUST continue to mean the unrotated rectangle’s top-left; the system MUST NOT redefine offset as the rotated axis-aligned bounding-box corner.

#### Scenario: Resize updates displayed offset around fixed center
- **WHEN** the user changes the selected slice’s width or height while the center stays fixed
- **THEN** Offset X and/or Offset Y update to the new unrotated top-left consistent with that center and size

#### Scenario: Rotation does not redefine offset meaning
- **WHEN** the selected slice has a non-zero rotation and the user edits Offset X or Offset Y
- **THEN** the committed position still places the unrotated rectangle’s top-left at the entered offset (rotation remains around the slice center)
