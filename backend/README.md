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
- **Action**: pending/running/succeeded/failed + payload/logs/timestamps; optional `script_id` and `software_id`; used for scripts, uninstall, software install, etc.
- **Script**: reusable automation with `name`, `description`, `language` (`powershell`|`bash`), `content`, optional `target_os_type`.
- **DeploymentProfile**: ordered task sequences; `is_template` differentiates templates vs. deployable profiles; optional `target_os_type`.
- **ProfileTask**: `name`, `description`, `order_index`, `action_type` (e.g., `powershell_inline`, `install_software`), optional `script_id`/`software_id`, `continue_on_error`.
- **SoftwarePackage**: software catalog entry with `installer_type` (`msi`|`exe`|`winget`|`choco`|`script`|`custom`), `source_type` (`url`|`file_share`|`local_path`), `source`, optional version/args/target_os.
- **EnrollmentToken**, **OSImage** support enrollment and future expansion.
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

## Software Catalog
- CRUD under `/api/v1/software` (list/filter by `target_os`, get, create, update, delete).
- Fields: `name`, optional `slug`/`version`, `installer_type` (`msi`/`exe`/`winget`/`choco`/`script`/`custom`), `source_type` (`url`/`file_share`/`local_path`), `source`, install/uninstall args, optional `target_os_type`.
- Deletion is blocked if software is referenced by profile/template tasks.
- Profile/template tasks can use `action_type="install_software"` with `software_id`; apply endpoints hydrate action payloads with installer metadata so agents receive self-contained JSON.

## Deployment Profiles & Templates
- Profiles (`/api/v1/profiles`) — CRUD plus tasks (`/tasks`) and apply (`/apply`) to create pending actions for one or more devices. Task CRUD supports list/create/update/delete and bulk replace via `/tasks/bulk`.
  - Task endpoints: `GET/POST /{profile_id}/tasks`, `PUT /{profile_id}/tasks/{task_id}`, `DELETE /{profile_id}/tasks/{task_id}`, `PUT /{profile_id}/tasks/bulk` (replace all tasks atomically).
  - Bulk payload example:
    ```json
    {
      "tasks": [
        { "name": "Prep", "order_index": 0, "action_type": "powershell_inline", "script_id": 1, "continue_on_error": true },
        { "name": "Post", "order_index": 1, "action_type": "powershell_inline", "script_id": 2 }
      ]
    }
    ```
  - Apply (`POST /{profile_id}/apply`) hydrates `payload` from referenced `Script.content` before creating actions so the agent always receives inline bodies.
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
