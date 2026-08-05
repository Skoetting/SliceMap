## ADDED Requirements

### Requirement: Optional dimension text on slice labels
The system SHALL provide a project-level option to include or omit each slice’s dimensions (`width×height`) in the on-slice label text. When the option is enabled, labels MUST include the slice dimensions in addition to the slice name. When the option is disabled, labels MUST show the slice name without dimension text.

#### Scenario: Dimensions included
- **WHEN** show-dimensions is enabled and a slice label is drawn
- **THEN** the label text includes the slice name and the slice’s width×height

#### Scenario: Dimensions omitted
- **WHEN** show-dimensions is disabled and a slice label is drawn
- **THEN** the label text includes the slice name and does not include width×height

#### Scenario: Default preserves current behavior
- **WHEN** a new project is created, or a legacy project without the option is loaded
- **THEN** show-dimensions is treated as enabled so labels still include dimensions by default

### Requirement: Label option applies to editor and export
The show-dimensions setting MUST affect both the editor canvas labels and the PNG export labels so preview and download stay consistent.

#### Scenario: Toggle updates preview and export
- **WHEN** the user disables show-dimensions and then exports a PNG
- **THEN** both the editor preview labels and the exported PNG labels omit dimensions

### Requirement: Persist show-dimensions setting
The system SHALL persist the show-dimensions option in the project JSON under export settings and restore it on load.

#### Scenario: Save and reload
- **WHEN** the user disables show-dimensions, saves the project, and loads the file again
- **THEN** show-dimensions remains disabled
