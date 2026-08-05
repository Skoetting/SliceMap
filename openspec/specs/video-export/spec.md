## Purpose

Export composition-sized H.264 MP4 test-pattern video for Resolume media / wall tests, alongside unchanged PNG input-map export.

## Requirements

### Requirement: Resolume-native MP4 container
The exported file MUST be an MP4 (H.264) suitable for Resolume Arena/Avenue media import. WebM MUST NOT be the primary export format.

#### Scenario: MP4 download
- **WHEN** the user triggers video export successfully
- **THEN** the browser downloads a `.mp4` file

### Requirement: Export video at composition resolution
The system SHALL export a video whose width and height equal the project composition size in pixels (rounded down to even dimensions if required by H.264), suitable for import as media in Resolume Arena for wall/mapping tests.

#### Scenario: Download test-pattern video
- **WHEN** the user triggers video export
- **THEN** the browser downloads a video file with frame dimensions equal to composition width × height (or the nearest even size)

### Requirement: Video encodes one seamless animation loop
The exported video MUST contain exactly one loop of the configured animation period at the configured frame rate, with phase continuous so looping playback in Resolume does not jump.

#### Scenario: Loop length
- **WHEN** period is 4 seconds and fps is 30
- **THEN** the exported video contains 120 frames (or equivalent duration ≈ 4.0s) covering one full period

#### Scenario: Seamless loop
- **WHEN** the video is played on repeat
- **THEN** the pattern phase at the end of the file matches the start closely enough that the loop appears continuous

### Requirement: Video uses animated design when animation is on
When animation is enabled, each video frame MUST draw slices with the current design and animation style at that frame’s time. When animation is disabled, the system SHALL still allow video export of a static (non-moving) composition for the configured duration, or clearly require enabling animation—whichever keeps the wall-test workflow unblocked without crashing.

#### Scenario: Animated export
- **WHEN** animation is enabled and the user exports video
- **THEN** successive frames show the progressing animation for the chosen style and design

### Requirement: Opaque plate for video (not PNG transparency)
Video frames MUST use a solid black background. Transparent PNG behavior remains for PNG input-map export only.

#### Scenario: Black background
- **WHEN** a video is exported
- **THEN** pixels outside slice artwork are opaque black, not transparent

### Requirement: Export progress and failure feedback
The system SHALL show progress or status while encoding and MUST surface a clear error if the browser cannot encode H.264 MP4 (e.g. missing WebCodecs / unsupported config).

#### Scenario: Unsupported codec
- **WHEN** video export is requested in an environment that cannot encode H.264 MP4
- **THEN** the user is informed and no corrupt/empty file is presented as success

#### Scenario: Progress while encoding
- **WHEN** encoding is in progress
- **THEN** the UI indicates that export is running (e.g. status text with progress)

### Requirement: PNG export unchanged
Existing PNG export for Resolume “Load Input Map” MUST continue to work as a static transparent composition-sized PNG and MUST NOT be replaced by video export.

#### Scenario: PNG still available
- **WHEN** the user triggers PNG export
- **THEN** a PNG downloads as before, independent of video export
