## Purpose

Bordered background plates behind on-slice labels so text stays readable on busy fills such as caro.

## Requirements

### Requirement: Label plate behind on-slice text
When label plates are enabled, the system SHALL draw a semi-opaque background plate with a slight border behind each on-slice label (name and optional dimensions) so text remains readable on busy fills such as caro.

#### Scenario: Plate under label on caro
- **WHEN** design is caro, labels are shown, and label plates are enabled
- **THEN** the label text sits on a bordered plate rather than raw checker cells alone

#### Scenario: Plate scales with text
- **WHEN** a slice label is drawn with a plate
- **THEN** the plate size fits the text block plus padding (not a full-slice banner)

### Requirement: Label plate setting persists
The system SHALL persist a composition-level setting for label plates (default on) in project JSON. Legacy projects without the field MUST default to plates enabled.

#### Scenario: Legacy load enables plates
- **WHEN** a project without label-plate settings is loaded
- **THEN** label plates are treated as enabled

### Requirement: Plates do not replace label content rules
Label plates MUST NOT change which text is shown: name remains; dimensions still respect the existing show-dimensions setting.

#### Scenario: Dimensions toggle with plate
- **WHEN** show-dimensions is off and plates are on
- **THEN** the plate backs the name-only label
