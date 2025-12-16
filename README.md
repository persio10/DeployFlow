# DeployFlow

DeployFlow Fleet is a dark-mode-first platform for provisioning and managing Windows endpoints with room to expand to other OSes. The monorepo contains a FastAPI backend, a Next.js admin console, and a .NET Worker agent that registers devices, executes actions, and reports results.

## Repository Layout
- `backend/` – FastAPI service with SQLAlchemy models, agent endpoints, script library, deployment profiles/templates, and device/action management.
- `agent/` – Windows-focused .NET 8 Worker Service that registers with the backend, heartbeats, executes actions (PowerShell inline, test, agent uninstall stub), and auto re-registers if its backend record disappears.
- `web/` – Next.js (App Router) admin UI with script library CRUD, profile/template builders, device pages, and action/log viewers.
- `docs/` – Product and architecture documentation.

## Quick Start
1. **Backend**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - Default dev enrollment token: `changeme` (set in `app/core/config.py`).
   - Optional dev utilities:
     - Reset SQLite schema: `python -m scripts.reset_dev_db` (destructive, dev-only).
     - Seed sample script/profile: `python -m scripts.seed_dev_data`.

2. **Web UI**
   ```bash
   cd web
   npm install
   npm run dev
   ```
   - Backend URL defaults to `http://localhost:8000`; override with `NEXT_PUBLIC_API_BASE_URL`.

3. **Agent**
   ```bash
   cd agent/DeployFlow.Agent
   dotnet run
   ```
   - Reads `appsettings.json` for backend URL, enrollment token, poll interval, and device state file.
   - Auto re-registers if heartbeat gets 404/410 after a backend device delete or DB reset.

## Backend Highlights
- **Models**: Device (with `os_type`, `os_version`, `hardware_summary`, `is_deleted`), Action (statuses pending/running/succeeded/failed, optional `script_id`/`software_id`), Script (language + `target_os_type`), SoftwarePackage (installer type + source metadata), DeploymentProfile + ProfileTask (ordered tasks, `is_template` for templates, supports `install_software`), EnrollmentToken, OSImage.
- **Agent API**: Register (`/api/v1/agent/register`), Heartbeat (`/api/v1/agent/heartbeat`, returns pending actions; 410 for deleted devices), Action result (`/api/v1/agent/actions/{id}/result`).
- **Device API**: List/get/update (filters out `is_deleted`), delete queues an `agent_uninstall` action then marks the device deleted, actions endpoints to queue/list per device.
- **Script Library**: Full CRUD with language + target OS validation; scripts can be referenced by actions or profile tasks.
- **Profiles & Templates**: CRUD for deployment profiles (`/profiles`) and templates (`/templates`), tasks with script or software references, apply endpoint creates pending actions per device; templates can be instantiated into editable profiles.
- **OS Validation**: Allowed OS values (`windows`, `windows_server`, `ubuntu`, `debian`, `proxmox`, `rhel`, `centos`, `macos`, `other`) and script languages (`powershell`, `bash`) enforced in schemas/endpoints.

## Agent Highlights
- Registers with enrollment token, sends OS info, reactivates soft-deleted devices on register, and heartbeats for pending actions.
- Handles actions: `test`, `powershell_inline` (runs `powershell.exe`, captures stdout/stderr), `agent_uninstall` (stub success). Reports status/logs/exit code back to backend.
- Caches device id in `device_state.json`; clears and re-registers if heartbeat receives 404/410.

## Web UI Highlights
- Devices list/detail with OS/status badges, action history, logs modal, run-script modal, apply-profile modal, and device delete that triggers backend uninstall action.
- Scripts page with CRUD, language/OS dropdowns, and content viewer/editor.
- Profiles and Templates pages with OS badges, task tables, creation/editing modals, and template instantiation into profiles.
- Dark layout with sidebar navigation and reusable badges/modals.
