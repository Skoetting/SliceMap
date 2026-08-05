## ADDED Requirements

### Requirement: Composition size defines the map canvas
The system SHALL let the user set composition width and height in pixels. The editor canvas and exported map MUST use this size as the coordinate space and PNG pixel dimensions.

#### Scenario: Set composition size
- **WHEN** the user enters width 1920 and height 1080
- **THEN** the project composition size is 1920×1080 and the editor reflects that aspect ratio

#### Scenario: Reject invalid sizes
- **WHEN** the user enters a non-positive width or height
- **THEN** the system MUST NOT apply the invalid size and MUST keep the previous valid composition size

### Requirement: Create and manage rectangular slices
The system SHALL allow the user to add, select, duplicate, rename, recolor, and delete rectangular slices on the composition.

#### Scenario: Add a slice
- **WHEN** the user adds a new slice
- **THEN** a rectangular slice is created with a unique id, default name, default size, default color, and zero rotation

#### Scenario: Delete selected slice
- **WHEN** a slice is selected and the user deletes it
- **THEN** that slice is removed from the project and selection is cleared

#### Scenario: Duplicate selected slice
- **WHEN** a slice is selected and the user duplicates it
- **THEN** a new slice is created with the same geometry and style, a distinct id, and a distinct name

### Requirement: Edit slice geometry with canvas and inspector
The system SHALL support editing each slice’s center position, width, height, and rotation in degrees via canvas interaction and numeric inspector fields.

#### Scenario: Move slice on canvas
- **WHEN** the user drags a selected slice on the canvas
- **THEN** the slice center updates in composition pixels and the inspector shows the new position

#### Scenario: Resize slice
- **WHEN** the user resizes a selected slice via handles or numeric width/height
- **THEN** the slice dimensions update and remain positive

#### Scenario: Rotate slice
- **WHEN** the user sets rotation to 15 degrees via handle or numeric field
- **THEN** the slice is drawn rotated 15 degrees around its center on the editor canvas

#### Scenario: Numeric precision
- **WHEN** the user enters exact numeric values for center, size, or rotation
- **THEN** the slice geometry updates to those values (rotation in degrees)

### Requirement: Soft overlap hints
The system SHALL detect when two or more slices overlap (accounting for rotation) and show a non-blocking hint. Overlapping slices MUST still be allowed for editing, saving, and export.

#### Scenario: Overlap warning shown
- **WHEN** two slices’ geometries intersect
- **THEN** the UI shows a hint that overlaps exist without blocking further edits

#### Scenario: Overlap allowed on export path
- **WHEN** overlapping slices exist and the user exports or saves
- **THEN** the operation proceeds successfully

#### Scenario: Hint clears when resolved
- **WHEN** slices no longer intersect
- **THEN** the overlap hint is no longer shown

### Requirement: Editor shows slice identity
The system SHALL display each slice’s name and enough visual outline/fill on the editor canvas for the user to distinguish slices while editing.

#### Scenario: Selected slice chrome
- **WHEN** a slice is selected
- **THEN** the editor shows selection chrome (handles and/or highlight) distinct from unselected slices
