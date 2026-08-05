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
When exporting more than one frame, the system SHALL deliver the PNGs as a single zip archive. When exporting exactly one frame, the system MAY download a single PNG file.

#### Scenario: Multiple slices zip
- **WHEN** the project has two or more slices and the user exports frames
- **THEN** the browser receives one zip containing one PNG per slice

#### Scenario: Single slice file
- **WHEN** the project has exactly one slice and the user exports frames
- **THEN** the browser receives one PNG for that slice

### Requirement: Usable filenames
Exported frame files SHALL use names derived from slice names (sanitized for filesystem safety). Duplicate names MUST be made unique.

#### Scenario: Safe unique names
- **WHEN** two slices share the same name
- **THEN** their exported files have distinct filenames

### Requirement: Existing exports unchanged
Composition PNG export and video export MUST continue to behave as before; frame export is an additional path and MUST NOT alter input-map PNG contents.

#### Scenario: Input map still full composition
- **WHEN** the user exports the composition PNG after changing frame border size
- **THEN** the PNG remains the composition-sized input map (not a per-slice frame)
