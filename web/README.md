# DeployFlow Fleet Web

Next.js 14 (App Router) dark-mode-first admin UI for DeployFlow Fleet.

## Getting Started
```bash
cd web
npm install
npm run dev
```
- Backend API defaults to `http://localhost:8000`; override with `NEXT_PUBLIC_API_BASE_URL`.

## Key Pages & Flows
- **/devices** — list enrolled devices (filters out deleted), OS/status badges, last check-in, links to detail.
- **/devices/[id]** — device summary, actions table with status badges + logs modal, Run Script modal (script library), Apply Profile modal, and Delete Device (queues backend uninstall action and redirects to list).
- **/scripts** — script library CRUD (create/edit/delete), language + target OS dropdowns, content viewer/editor, inline validation.
- **/scripts/[id]** — detail view with edit/delete controls.
- **/profiles** — lists deployment profiles (non-templates) with target OS badges; create/edit/delete via profile editor modal with task sequencing from script library.
- **/profiles/[id]** — profile detail, tasks table, edit/delete actions, apply-from-device supported via device page.
- **/templates** — template profiles (is_template=true) with target OS badges; create/edit/delete; templates can be instantiated into new profiles.
- **/templates/[id]** — template detail, tasks table, edit/delete, “Use this template” to instantiate and redirect to the new profile.

## UI Notes
- Dark layout with sidebar navigation, top nav, status badges (device/action), and reusable modals (script editor, profile editor, logs viewer).
- Target OS selections use shared dropdown options (`windows`, `windows_server`, `ubuntu`, `debian`, `proxmox`, `rhel`, `centos`, `macos`, `other`).
- Device deletion confirms before calling backend and shows a toast after success or failure.
- Actions history includes colored status indicators and logs modal for inspecting stdout/stderr and exit codes returned by the agent.
