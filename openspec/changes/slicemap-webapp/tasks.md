## 1. Project scaffolding

- [x] 1.1 Scaffold Vite + React + TypeScript app named SliceMap with GitHub Pages-friendly `base` config
- [x] 1.2 Add README with purpose, local dev steps, and Resolume Load Input Map workflow
- [x] 1.3 Add GitHub Actions workflow to build and deploy `dist/` to GitHub Pages

## 2. Domain model

- [x] 2.1 Define TypeScript types for project, composition, slice (center-based geometry + rotation + color), and export settings
- [x] 2.2 Implement project create/default helpers and unique slice id generation
- [x] 2.3 Implement geometry helpers: corner points, rotated draw transform, positive size clamping
- [x] 2.4 Implement oriented overlap detection across slices

## 3. Slice editor UI

- [x] 3.1 Build app shell with composition size controls and SliceMap branding
- [x] 3.2 Implement slice list actions: add, select, duplicate, delete, rename, recolor
- [x] 3.3 Implement numeric inspector for cx, cy, width, height, rotationDeg
- [x] 3.4 Implement scaled editor canvas rendering slices with fills, outlines, and names
- [x] 3.5 Add canvas interaction: select, drag move, resize handles, rotate handle
- [x] 3.6 Show non-blocking overlap hint when any slices intersect

## 4. PNG export

- [x] 4.1 Render off-screen canvas at exact composition resolution (transparent background)
- [x] 4.2 Draw rotated slices with semi-transparent fills, outlines, and name + WxH labels
- [x] 4.3 Wire stroke-width setting into editor preview and PNG export
- [x] 4.4 Implement PNG download action; handle zero-slice case per spec

## 5. Project persistence

- [x] 5.1 Serialize project to versioned JSON and trigger file download
- [x] 5.2 Load JSON via file picker with validation; reject invalid files without corrupting state
- [x] 5.3 Verify save → load round-trip preserves geometry and style fields

## 6. Polish and verify

- [x] 6.1 Manual check: export PNG loads correctly as Resolume Arena Load Input Map guide
- [x] 6.2 Smoke-test build (`npm run build`) and confirm Pages base path works locally with preview
