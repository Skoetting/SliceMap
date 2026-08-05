## Purpose

Composition-wide RasterVideo-style geometry overlays—frame, center cross, and inscribed circle—on every slice in editor, PNG, and video.

## Requirements

### Requirement: Composition-wide geometry guides
The system SHALL provide composition-wide geometry overlays drawn on every slice: a clear outer frame, an optional center cross, and an optional inscribed center circle. Guide visibility MUST be controlled by project export/guide settings and MUST persist in project JSON with safe defaults when missing (guides enabled; cross, circle, and label-related flags on).

#### Scenario: Guides on by default
- **WHEN** a new project is created or a legacy project without guide settings is loaded
- **THEN** geometry guides are enabled so slices show the professional frame and circle overlays

#### Scenario: Disable guides
- **WHEN** the user disables geometry guides
- **THEN** the inscribed circle and overlay cross are not drawn (fill design and basic outline behavior remain)

### Requirement: Strong slice frame
When guides are enabled, each slice MUST be drawn with a clear rectangular frame along its bounds (using the project stroke width), suitable as a RasterVideo-style panel border in the editor, PNG export, and video frames.

#### Scenario: Frame follows rotation
- **WHEN** a slice is rotated and guides are enabled
- **THEN** the frame outline rotates with the slice in local space

### Requirement: Inscribed center circle
When guides are enabled and the circle guide is on, the system SHALL draw a stroke-only circle centered on the slice, with radius fitting inside the slice (inset from the shorter side so the stroke remains inside the frame).

#### Scenario: Circle inside slice
- **WHEN** a slice is drawn with the circle guide on
- **THEN** the circle is centered on the slice and does not extend outside the slice rectangle

#### Scenario: Circle with caro fill
- **WHEN** design is caro and the circle guide is on
- **THEN** the circle remains visible on top of the checker pattern

### Requirement: Center cross overlay
When guides are enabled and the cross guide is on, the system SHALL draw thin horizontal and vertical guide lines through the slice center spanning edge to edge in slice-local space.

#### Scenario: Cross spans slice
- **WHEN** the cross guide is on
- **THEN** horizontal and vertical guide lines meet at the slice center and reach the opposite edges

#### Scenario: Avoid double-cross with cross fill design
- **WHEN** composition design is `cross` and the overlay cross would duplicate the thick fill cross
- **THEN** the system MUST NOT draw a redundant thick double-cross (suppress overlay cross or keep only one clear cross)

### Requirement: Shared draw path
Editor preview, PNG export, and video frames MUST use the same guide geometry rules for a given project state (aside from editor-only selection chrome).

#### Scenario: PNG matches preview guides
- **WHEN** guides are enabled and the user exports a PNG
- **THEN** exported slices include the same frame, circle, and cross settings as the editor preview
