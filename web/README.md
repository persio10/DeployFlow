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
  - `/devices/[id]` — device detail with recent actions, **Run Script** modal (script library), **Apply Profile** flow, action status badges, and log viewer.
  - `/scripts` — view scripts available in the backend script library.
  - `/profiles` — list deployment profiles with target OS badges.
  - `/profiles/[id]` — profile detail with task listing and target OS context.

## UI Notes

- Dark-mode-first layout with sidebar navigation and status badges.
- Actions history includes colored status indicators and a logs modal for inspecting outputs.
- Device pages surface OS type/last check-in, plus profile application and script execution controls.
- Configure backend URL with `NEXT_PUBLIC_API_BASE_URL` if the API is not on `http://localhost:8000`.
