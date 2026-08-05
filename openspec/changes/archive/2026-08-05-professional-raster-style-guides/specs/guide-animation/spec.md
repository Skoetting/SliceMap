## ADDED Requirements

### Requirement: Animate geometry guides when animation is enabled
When project animation is enabled, the system SHALL animate visible geometry guides (center cross lines and inscribed circle) over the animation period in the editor preview and in exported video frames. Guide animation MUST use the same time base and per-slice phase offset as existing fill animation.

#### Scenario: Preview animates circle and cross
- **WHEN** animation is enabled, guides (circle and cross) are on, and the editor preview is running
- **THEN** the circle and cross guides visibly change over time (e.g. traveling dashes or pulse), not only the fill pattern

#### Scenario: Video includes guide motion
- **WHEN** animation is enabled and the user exports video
- **THEN** successive frames show progressing guide animation consistent with the preview at the same times

### Requirement: Animation styles drive guide motion
For style `phase-scroll`, guides MUST use traveling dashed strokes (or equivalent continuous motion along the circle/cross). For style `pulse`, guides MUST pulse (radius and/or stroke emphasis) over the period. Labels and label plates MUST remain static and readable.

#### Scenario: Phase-scroll dashes
- **WHEN** animation style is phase-scroll and guides are visible
- **THEN** dashed motion travels along the circle and/or cross over one period

#### Scenario: Pulse style on guides
- **WHEN** animation style is pulse and guides are visible
- **THEN** the circle and/or cross pulse in size or emphasis over the period while label text stays fixed

### Requirement: Static guides when animation is off
When animation is disabled, geometry guides MUST render as solid static strokes at their base geometry (no dash travel, no radius pulse beyond the static inscribed circle).

#### Scenario: Animation off
- **WHEN** animation is disabled and guides are enabled
- **THEN** circle and cross appear static in the editor and in video frames exported for that project state
