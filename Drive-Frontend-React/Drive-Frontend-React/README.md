# Drive-Frontend (React + Vite)

A Google Drive style interface for Drive-Service: folders, upload (button or drag and drop),
download, delete, search, list/grid view and breadcrumbs.

## Run (needs Node.js 18 or newer)
    npm install
    npm run dev
Open http://localhost:5173

Start Storage-Service (8092) and Drive-Service (8091) first. The dev server forwards /api to
http://localhost:8091 (see vite.config.js), so no CORS setup is needed.
To use another backend address: set DRIVE_API, e.g. `set DRIVE_API=http://localhost:9000` (Windows cmd) before `npm run dev`.

## Production build
    npm run build      (output in dist/, serve it behind a proxy that forwards /api to Drive-Service)
