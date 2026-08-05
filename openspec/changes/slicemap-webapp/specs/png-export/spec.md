## ADDED Requirements

### Requirement: Export PNG at composition resolution
The system SHALL export a PNG whose width and height equal the project composition size in pixels, suitable for Resolume Arena Advanced Output “Load Input Map”.

#### Scenario: Download input map PNG
- **WHEN** the user triggers PNG export
- **THEN** the browser downloads a PNG file with pixel dimensions equal to composition width × height

### Requirement: PNG is optimized as an input-map guide
The exported PNG MUST use a transparent background, draw each slice with a visible outline and optional semi-transparent fill, and include slice information labels so zoom and aspect can be verified visually.

#### Scenario: Transparent background
- **WHEN** a PNG is exported
- **THEN** pixels outside slice fills/outlines/labels are transparent (alpha 0)

#### Scenario: Outlines and labels present
- **WHEN** a PNG is exported with one or more slices
- **THEN** each slice is drawn with a clear outline and a label that includes at least the slice name and width×height

#### Scenario: Rotation reflected in export
- **WHEN** a slice has non-zero rotation
- **THEN** the exported PNG draws that slice rotated to match the editor geometry

### Requirement: Configurable outline thickness
The system SHALL allow the user to set outline stroke thickness used for the exported map (and preferably mirrored in the editor preview).

#### Scenario: Change stroke width
- **WHEN** the user sets stroke width to a positive value and exports
- **THEN** slice outlines in the PNG use that stroke width

### Requirement: Empty project export behavior
When no slices exist, the system SHALL still allow export of a transparent PNG at composition size, or clearly indicate that there is nothing to map—whichever keeps the workflow unblocked without producing a misleading labeled map.

#### Scenario: Export with zero slices
- **WHEN** the project has no slices and the user exports PNG
- **THEN** the system either downloads a transparent composition-sized PNG or informs the user that no slices exist, without crashing
