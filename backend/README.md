# DeployFlow Fleet Backend

FastAPI backend powering DeployFlow Fleet with SQLAlchemy models, Pydantic v2 schemas, and agent/device orchestration.

## Getting Started
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- Default dev enrollment token: `changeme` (`app/core/config.py`).
- API docs: http://localhost:8000/docs

## Core Concepts & Models
- **Device**: hostname, status, `os_type`, `os_version`, `hardware_summary`, `profile_id`, `last_check_in`, `is_deleted`, timestamps.
- **Action**: pending/running/succeeded/failed + payload/logs/timestamps; optional `script_id`; used for scripts, uninstall, etc.
- **Script**: reusable automation with `name`, `description`, `language` (`powershell`|`bash`), `content`, optional `target_os_type`.
- **DeploymentProfile**: ordered task sequences; `is_template` differentiates templates vs. deployable profiles; optional `target_os_type`.
- **ProfileTask**: `name`, `description`, `order_index`, `action_type` (e.g., `powershell_inline`), optional `script_id`, `continue_on_error`.
- **EnrollmentToken**, **SoftwareItem**, **OSImage** support enrollment and future expansion.
- **Allowed OS types** (enforced in schemas/endpoints): `windows`, `windows_server`, `ubuntu`, `debian`, `proxmox`, `rhel`, `centos`, `macos`, `other`.

## Agent API
- `POST /api/v1/agent/register` — register or reactivate a device (soft-deleted devices are revived; OS info captured).
- `POST /api/v1/agent/heartbeat` — updates status/check-in, returns pending actions; returns 410 if device was deleted server-side.
- `POST /api/v1/agent/actions/{action_id}/result` — submit action result (status/logs/exit code note).
- `GET /api/v1/agent/heartbeat` — debug ping.

## Devices & Actions
- `GET /api/v1/devices` / `GET /api/v1/devices/{id}` — list/get active devices (filters `is_deleted=False`).
- `PUT /api/v1/devices/{id}` — update device metadata.
- `DELETE /api/v1/devices/{id}` — marks device deleted and queues `agent_uninstall` action (payload includes reason); returns 404 for missing/deleted.
- Actions per device:
  - `POST /api/v1/devices/{device_id}/actions` — queue action (inline payload or `script_id`, validates OS compatibility when specified).
  - `GET /api/v1/devices/{device_id}/actions` — list actions for a device.

## Script Library
- CRUD under `/api/v1/scripts` (list, get, create, update, delete).
- Validates `language` and optional `target_os_type` against allowed sets.
- Device actions and profile tasks can reference `script_id`; backend injects script content into action payloads.

## Deployment Profiles & Templates
- Profiles (`/api/v1/profiles`) — CRUD plus tasks (`/tasks`) and apply (`/apply`) to create pending actions for one or more devices. Task CRUD supports list/create/update/delete and bulk replace via `/tasks/bulk`.
- Templates (`/api/v1/templates`) — profiles with `is_template=true`; can be instantiated via `POST /api/v1/templates/{id}/instantiate` into editable profiles. Task CRUD matches profiles, including `/tasks/bulk` for replacement.
- Update/delete supported for both profiles and templates; tasks cascade on delete.

## OS Awareness & Validation
- Devices carry `os_type`; scripts/profiles can declare `target_os_type`.
- Action creation rejects mismatched script/device OS when both are set.
- Agent registers with `os_type="windows"` by default (includes OS description from agent payload).

## Dev Utilities
- **Reset dev SQLite (destructive)**: `python -m scripts.reset_dev_db`
- **Seed sample data**: `python -m scripts.seed_dev_data` (adds Ping WAN script + baseline Windows profile).

## Pydantic v2 Notes
- Settings via `pydantic-settings.BaseSettings` (`app/core/config.py`).
- Schemas use `model_config = ConfigDict(from_attributes=True)`.
