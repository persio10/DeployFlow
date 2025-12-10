# DeployFlow Fleet Web

This is the Next.js dark-mode-first admin UI for DeployFlow Fleet.

## Getting Started

```bash
cd web
npm install
npm run dev
```

- Backend API is expected at `http://localhost:8000` (override via `NEXT_PUBLIC_API_BASE_URL`).
- Key pages:
  - `/devices` — list enrolled devices with status and last check-in.
  - `/devices/[id]` — device detail with recent actions, **Run Script** modal (script library), and **Apply Profile** flow.
  - `/scripts` — view scripts available in the backend script library.
  - `/profiles` — list deployment profiles.
  - `/profiles/[id]` — profile detail with task listing.
