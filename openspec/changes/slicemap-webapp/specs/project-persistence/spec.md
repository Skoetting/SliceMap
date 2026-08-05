## ADDED Requirements

### Requirement: Save project as JSON
The system SHALL let the user download the current project as a JSON file that includes a schema version, composition size, and all slices (id, name, geometry, rotation, color) plus export settings needed to recreate the map.

#### Scenario: Download project file
- **WHEN** the user chooses save/download project
- **THEN** a JSON file is downloaded containing version, composition, and slices sufficient to restore the project

### Requirement: Load project from JSON
The system SHALL let the user load a previously saved SliceMap JSON file and restore composition size and slices into the editor.

#### Scenario: Load valid project
- **WHEN** the user selects a valid SliceMap JSON file
- **THEN** the editor shows the restored composition size and slices

#### Scenario: Reject invalid project
- **WHEN** the user selects a file that is not valid SliceMap JSON
- **THEN** the system MUST NOT replace the current project with partial data and MUST inform the user that load failed

### Requirement: Round-trip fidelity
Saving then loading a project MUST restore slice geometry and identity fields so a subsequent PNG export matches the pre-save layout (within normal floating-point tolerance for rotation/position).

#### Scenario: Save then load preserves layout
- **WHEN** the user saves a project with multiple rotated slices and loads that file into a fresh session
- **THEN** each slice’s name, color, center, size, and rotation match the saved values
