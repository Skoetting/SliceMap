# SliceMap

Browser app for designing **Resolume Arena / Avenue input maps**.

**Use it online:** [https://skoetting.github.io/SliceMap/](https://skoetting.github.io/SliceMap/)

Arrange rectangular slices on your composition, then export:

- **Input Map** PNG → Advanced Output → **Load Input Map**
- **Test Video** MP4 → wall / LED stress tests
- **Slice Frames** → hollow border PNGs for Radar-style outline FX (no plugins)

Free, static (no backend). Run locally with npm, on **GitHub Pages**, or with **Docker**.

## Quick start (Docker)

Requires [Docker](https://docs.docker.com/get-docker/).

```bash
docker compose up --build
```

Open **http://localhost:8080/**

Stop with `Ctrl+C`, or run detached:

```bash
docker compose up --build -d
docker compose down
```

### Plain Docker

```bash
docker build -t slicemap .
docker run --rm -p 8080:80 slicemap
```

Then open http://localhost:8080/

## Features

- Composition size control (exports at exact pixel dimensions)
- Rectangular slices: name, color, offset, width, height, rotation
- Canvas editor with move / resize / rotate, magnetic snap, zoom & pan
- Soft overlap hints (overlaps are still allowed)
- **Import Advanced Output** screen-setup XML (best-effort)
- **Export → Input Map** PNG for Load Input Map
- **Export → Slice Frames** menu (border px + hollow white border PNGs; zip when multiple)
- **Export Test Video** (H.264 MP4) from the sidebar
- Save / load projects as JSON

## Local development (npm)

```bash
npm install
npm run dev
```

Open the URL Vite prints. Default asset base is `/SliceMap/` (GitHub Pages path).

```bash
npm run build
npm run preview
```

To build/serve at site root (same as Docker):

```bash
VITE_BASE=/ npm run build
VITE_BASE=/ npm run preview
```

## Resolume workflow

1. Set composition width/height to match Arena — or **Import → Advanced Output** from an existing preset.
2. Add and position slices (or adjust after import).
3. Click **Export → Input Map** in the top toolbar.
4. In Resolume: **Advanced Output** → **Input Selection** → **Load Input Map** → pick the PNG.
5. Adjust guide opacity and align slices to the outlines / labels.

### Import Advanced Output XML

Presets are usually under Documents, for example:

- macOS: `~/Documents/Resolume Arena/presets/screensetup/`
- Windows: `Documents\Resolume Arena\presets\screensetup\`

(Folder name may include Avenue/Arena and a version.)

Notes:

- Format is **unofficial** and may change across Resolume versions (best-effort).
- Only rectangular **InputRect** slices are imported; warped / soft-edge geometries are skipped.
- SliceMap does **not** write Advanced Output XML back — use PNG, MP4, or project JSON.

### Export Slice Frames (outline FX)

Top toolbar: **Export → Slice Frames** opens a menu for border thickness (px), then exports one PNG per slice (slice width×height): transparent interior, opaque white border. Use with Resolume Radar (or similar) for outline looks without plugins.

- One slice → single PNG; multiple → zip
- Independent of the Input Map outline stroke
- Not a substitute for Load Input Map

## Project JSON

Saved files use schema `version: 1` with composition, slices (`cx`, `cy`, `width`, `height`, `rotationDeg`, `color`), and export settings.

## Deploy

### GitHub Pages

Live app: **[https://skoetting.github.io/SliceMap/](https://skoetting.github.io/SliceMap/)**

This repo includes `.github/workflows/deploy-pages.yml`. On push to `main`:

1. Repo **Settings → Pages → Source: GitHub Actions**
2. Workflow builds with Vite base `/SliceMap/` and publishes `dist/`

### Docker image (registry)

Build and push if you host your own registry:

```bash
docker build -t your-registry/slicemap:latest .
docker push your-registry/slicemap:latest
```

Pull and run elsewhere:

```bash
docker run --rm -p 8080:80 your-registry/slicemap:latest
```

## License

MIT
