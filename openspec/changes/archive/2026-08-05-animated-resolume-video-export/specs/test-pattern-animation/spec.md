## ADDED Requirements

### Requirement: Composition-level animation settings
The system SHALL provide composition-wide settings to enable test-pattern animation, choose an animation style, and set the loop period in seconds. These settings MUST apply to all slices and MUST persist in the project JSON with safe defaults when missing (animation disabled).

#### Scenario: Enable animation
- **WHEN** the user turns animation on
- **THEN** the editor preview begins animating slice fill/pattern according to the selected style and period

#### Scenario: Disable animation
- **WHEN** the user turns animation off
- **THEN** the editor preview shows the static slice design (identical to the non-animated look)

#### Scenario: Load legacy project
- **WHEN** a project JSON without animation fields is loaded
- **THEN** animation is disabled and the visual result matches the previous static behavior

### Requirement: Animation styles reveal mapping issues
The system SHALL support at least two animation styles usable for wall testing: a phase/scroll-style motion (especially effective with caro) and a pulse-style brightness/opacity cycle. Animation MUST NOT move or resize slice geometry—only the drawn fill/pattern (and related cues) change over time.

#### Scenario: Phase-scroll with caro
- **WHEN** design is caro, style is phase-scroll, and animation is enabled
- **THEN** the checker pattern continuously shifts phase over one period and repeats seamlessly

#### Scenario: Pulse style
- **WHEN** style is pulse and animation is enabled
- **THEN** slice fill/pattern opacity or brightness cycles over the period while outlines and labels remain readable

### Requirement: Shared time for preview frames
The editor preview MUST use the same time-based drawing rules that video export will use for a given project time `t`, so what the user sees is what gets encoded.

#### Scenario: Preview matches export frame
- **WHEN** animation is enabled and the preview shows time `t` within the period
- **THEN** a video frame rendered at the same `t` uses the same pattern phase and appearance for each slice

### Requirement: Per-slice phase separation
When animation is enabled, the system SHALL offset animation phase per slice (e.g. by slice order) so neighboring slices are not perfectly synchronized, making slice identity easier to verify on physical walls.

#### Scenario: Adjacent slices differ in phase
- **WHEN** two slices are visible and animation is running
- **THEN** their animated patterns are not locked to identical phase for the entire period
