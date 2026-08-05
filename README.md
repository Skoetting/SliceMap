# SliceMap

Browser app for designing **Resolume Arena / Avenue input maps**.

**Use it online:** [https://skoetting.github.io/SliceMap/](https://skoetting.github.io/SliceMap/)

## Features

- **Input Map PNG** — export a composition-sized map for Advanced Output → **Load Input Map**
- **Test Video MP4** — H.264 wall / LED stress tests from the same layout
- **Slice Frames** — hollow white border PNGs per slice **plus** one composition image with all borders (`frames-all.png`); border px in **Export → Slice Frames**
- **Import Advanced Output** — load an existing screen-setup XML (rectangular InputRect, best-effort)
- **Canvas editor** — move / resize / rotate, magnetic snap, zoom & pan, soft overlap hints
- **Exact pixels** — set composition size; slices have name, color, offset, width, height, rotation
- **Project JSON** — save / load layouts (`version: 1`)

Free and static (no backend). Run in the browser, with npm, or with Docker.

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

Top toolbar: **Export → Slice Frames** opens a menu for border thickness (px), then downloads a zip with:

- one PNG per slice (slice width×height): transparent interior, opaque white border
- **`frames-all.png`** — composition-sized image with every slice border drawn at its position / rotation

Use with Resolume Radar (or similar) for outline looks without plugins.

- Independent of the Input Map outline stroke
- Not a substitute for Load Input Map

## Project JSON

Saved files use schema `version: 1` with composition, slices (`cx`, `cy`, `width`, `height`, `rotationDeg`, `color`), and export settings.

## License

MIT
