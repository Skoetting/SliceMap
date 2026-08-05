## ADDED Requirements

### Requirement: Configure frame border size
The system SHALL allow the user to set a frame border thickness in pixels used when exporting per-slice frame images. This setting MUST be independent of the composition input-map outline stroke width.

#### Scenario: Set border size
- **WHEN** the user enters a positive frame border size
- **THEN** the project stores that value for subsequent frame exports

#### Scenario: Default when missing from saved project
- **WHEN** a project JSON without a frame border field is loaded
- **THEN** the system applies a sensible default border size without failing the load

### Requirement: Export one frame PNG per slice
The system SHALL provide an export action that generates one PNG per slice at that slice’s width×height, with a fully transparent interior and an opaque rectangular border of the configured thickness fully inside the image bounds.

#### Scenario: Export frames for a project with slices
- **WHEN** the user triggers Export frames and the project has one or more slices
- **THEN** each slice produces a PNG whose pixel size matches the slice width and height (rounded) and whose only opaque pixels form the border frame

#### Scenario: No slices
- **WHEN** the user triggers Export frames and the project has no slices
- **THEN** the system does not download frame files and informs the user that slices are required

### Requirement: Border clamping on small slices
When twice the border thickness would leave no hollow interior, the system SHALL clamp the border for that slice to a feasible value and MUST still export a valid PNG.

#### Scenario: Border thicker than slice allows
- **WHEN** a slice is smaller than needed for the configured border
- **THEN** that slice’s frame uses a reduced border and the user is informed that clamping occurred

### Requirement: Multi-slice download packaging
When exporting frames, the system SHALL deliver a zip archive containing one PNG per slice **and** one composition-sized PNG (`frames-all.png`) with every slice border drawn at its position and rotation. A single-slice project still receives a zip (per-slice file + composite).

#### Scenario: Multiple slices zip
- **WHEN** the project has two or more slices and the user exports frames
- **THEN** the browser receives one zip containing one PNG per slice plus `frames-all.png`

#### Scenario: Single slice zip with composite
- **WHEN** the project has exactly one slice and the user exports frames
- **THEN** the browser receives one zip containing that slice’s frame PNG and `frames-all.png`

### Requirement: Composition composite of all slice borders
The system SHALL include a transparent composition-sized PNG whose only opaque pixels are the hollow white borders of every slice, transformed to each slice’s center and rotation (matching editor geometry).

#### Scenario: Composite matches layout
- **WHEN** frames are exported for a project with positioned / rotated slices
- **THEN** `frames-all.png` is composition width×height and places each border where that slice appears on the canvas

### Requirement: Usable filenames
Exported frame files SHALL use names derived from slice names (sanitized for filesystem safety). Duplicate names MUST be made unique. The composition composite MUST use a stable filename (`frames-all.png`).

#### Scenario: Safe unique names
- **WHEN** two slices share the same name
- **THEN** their exported files have distinct filenames

### Requirement: Existing exports unchanged
Composition PNG export and video export MUST continue to behave as before; frame export is an additional path and MUST NOT alter input-map PNG contents.

#### Scenario: Input map still full composition
- **WHEN** the user exports the composition PNG after changing frame border size
- **THEN** the PNG remains the composition-sized input map (not a per-slice frame)
