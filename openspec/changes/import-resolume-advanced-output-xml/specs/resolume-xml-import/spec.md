## ADDED Requirements

### Requirement: Import Advanced Output XML from disk
The system SHALL allow the user to select a Resolume Advanced Output screen-setup preset XML file and load it into the editor as a SliceMap project layout (composition size and slices) suitable for preview and test-pattern PNG/MP4 export.

#### Scenario: Successful import
- **WHEN** the user chooses a valid screen-setup XML that contains one or more rectangular input slices
- **THEN** the editor shows corresponding slices and the user can export PNG or video against that layout

#### Scenario: File picker accepts XML
- **WHEN** the user triggers Import XML
- **THEN** the file picker accepts `.xml` (and optionally related Resolume preset extensions if needed)

### Requirement: Map input rectangles to SliceMap slices
For each supported rectangular input region in the XML, the system SHALL create a slice with name (when available), center, width, height, and rotation derived from the input geometry in composition space.

#### Scenario: Axis-aligned input rect
- **WHEN** an input rectangle is axis-aligned on the composition
- **THEN** the imported slice matches that width, height, and position (center-based)

#### Scenario: Rotated rectangular input
- **WHEN** an input rectangle is rotated but remains rectangular
- **THEN** the imported slice includes a matching rotation

### Requirement: Composition size from preset or inference
The system SHALL set composition width and height from the preset when available; otherwise it SHALL infer a size that fits the imported input slices or keep the current size with a clear status warning.

#### Scenario: Explicit size present
- **WHEN** the XML provides a usable composition size
- **THEN** the project composition matches that size after import

#### Scenario: Size missing
- **WHEN** the XML has slices but no clear composition size
- **THEN** the system still imports slices and either infers size or warns that composition size should be checked

### Requirement: Replace existing slices with confirmation
When the project already contains slices, the system SHALL ask for confirmation before replacing them with the imported layout.

#### Scenario: Confirm replace
- **WHEN** the project has slices and the user imports XML
- **THEN** the user is prompted to confirm replacement before the current slices are discarded

#### Scenario: Empty project import
- **WHEN** the project has no slices and the user imports XML
- **THEN** slices are loaded without a replace confirmation

### Requirement: Unsupported geometry and bad files
The system SHALL skip non-rectangular or unsupported slice geometries without crashing, report how many were imported vs skipped, and MUST show a clear error if the file cannot be parsed as a screen-setup preset.

#### Scenario: Mixed supported and unsupported slices
- **WHEN** the XML contains both rectangular and non-rectangular inputs
- **THEN** rectangular slices are imported and the status indicates how many were skipped

#### Scenario: Invalid file
- **WHEN** the user selects a non-XML or unrecognized preset
- **THEN** the project is left unchanged and the user sees an error status

### Requirement: Existing export paths still work after import
After a successful import, PNG export and video export MUST continue to work using the imported composition and slices (subject to existing export rules).

#### Scenario: Export video after XML import
- **WHEN** the user imports XML and then exports video
- **THEN** the video is encoded at the project composition size with the imported slices drawn
