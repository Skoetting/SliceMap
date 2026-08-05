## ADDED Requirements

### Requirement: Composition-wide visual design choice
The system SHALL allow the user to choose one visual design for the whole composition: `simple`, `caro`, or `cross`. The chosen design MUST apply to every slice and MUST be preserved across save and load. New projects and projects that omit the field MUST default to `simple`.

#### Scenario: Choose caro for the composition
- **WHEN** the user sets the composition design to `caro`
- **THEN** every slice is drawn with the caro pattern

#### Scenario: Change design updates all slices
- **WHEN** the user changes the composition design from `simple` to `cross`
- **THEN** all slices update to the cross design (no per-slice override)

#### Scenario: Default design for new project
- **WHEN** the user creates a new project
- **THEN** the composition design is `simple`

#### Scenario: Legacy project load
- **WHEN** the user loads a project JSON that omits a design field
- **THEN** the composition design is treated as `simple`

### Requirement: Simple design appearance
When the composition design is `simple`, the system SHALL draw each slice with a semi-transparent fill in the slice color and an outline, matching the existing flat-slice look.

#### Scenario: Simple fill and outline
- **WHEN** the composition design is `simple` and a slice is drawn in the editor or on PNG export
- **THEN** the slice shows a translucent colored fill and a colored outline within its rotated bounds

### Requirement: Caro design appearance
When the composition design is `caro`, the system SHALL draw a checkered (karo) pattern that spans the entire interior of each slice (clipped to the slice rectangle), using the slice color so the pattern is readable as an input-map guide.

#### Scenario: Caro covers whole slice
- **WHEN** the composition design is `caro` and a slice is drawn
- **THEN** a checkerboard pattern fills the full width and height of the slice (not only a corner or border band)

#### Scenario: Caro respects rotation
- **WHEN** the composition design is `caro` and a slice is rotated
- **THEN** the checkerboard is drawn in slice-local space and appears rotated with the slice on the composition

### Requirement: Cross design appearance
When the composition design is `cross`, the system SHALL draw on each slice a cross that spans the whole slice—edge to edge horizontally and vertically through the slice center—similar to Mapping Guru–style panel crosses, using the slice color, plus a slice outline.

#### Scenario: Cross spans full slice
- **WHEN** the composition design is `cross` and a slice is drawn
- **THEN** a vertical guide and a horizontal guide meet at the slice center and each extends to the opposite edges of the slice

#### Scenario: Cross respects rotation
- **WHEN** the composition design is `cross` and a slice is rotated
- **THEN** the cross rotates with the slice (axis-aligned in slice-local space)

### Requirement: Editor and export use the same design
The editor canvas preview and the exported PNG MUST render every slice using the composition’s stored design so what the user sees while editing matches the downloadable input map (aside from editor-only selection chrome).

#### Scenario: Export matches chosen design
- **WHEN** the composition design is `caro` and the user exports a PNG
- **THEN** every exported slice uses the caro pattern
