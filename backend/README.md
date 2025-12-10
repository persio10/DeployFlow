# DeployFlow Fleet Backend

This is the FastAPI backend for DeployFlow Fleet.

## Getting Started

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API & Models

Core models include OSImage, DeploymentProfile, ProfileTask, Script, SoftwareItem, Device, Action, and EnrollmentToken.
Basic CRUD endpoints are available for scripts, software items, and devices under `/api/v1/`.

To explore the API:

- Start the server: `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Open Swagger UI: http://localhost:8000/docs

## Agent API

The backend exposes a simple JSON API for agents:

- `POST /api/v1/agent/register` – register an agent with an enrollment token.
- `POST /api/v1/agent/heartbeat` – send heartbeat and receive pending actions.
- `POST /api/v1/agent/actions/{action_id}/result` – report the result of an action.

An optional debug endpoint is available for quick checks:

- `GET /api/v1/agent/heartbeat` – simple JSON response confirming the endpoint is alive.

These endpoints enable the DeployFlow Windows agent to execute scripts and software installs on managed devices.

## Device Actions API

The backend exposes simple endpoints to queue actions for managed devices:

- `POST /api/v1/devices/{device_id}/actions` – create an action for a device (e.g., run a script, install software).
- `GET /api/v1/devices/{device_id}/actions` – list actions for a device.

Agents receive pending actions via `POST /api/v1/agent/heartbeat` and report results to `POST /api/v1/agent/actions/{action_id}/result`.

### PowerShell Inline Actions

The agent supports a simple action type for executing PowerShell on Windows devices:

- `type = "powershell_inline"`
- `payload` is a raw PowerShell script string.

Example action body via `POST /api/v1/devices/{device_id}/actions`:

```json
{
  "type": "powershell_inline",
  "payload": "Get-Process | Select-Object -First 5"
}
```

The agent executes the script, captures stdout/stderr, and reports back status, exit code, and logs via `POST /api/v1/agent/actions/{action_id}/result`.

## Script Library

DeployFlow includes a basic Script Library for reusable automation:

- `Script` model:
  - `name` – unique name for the script.
  - `description` – optional description.
  - `language` – e.g. `powershell`.
  - `content` – the script body.

### Script API

- `GET /api/v1/scripts` – list all scripts.
- `GET /api/v1/scripts/{id}` – get a script by id.
- `POST /api/v1/scripts` – create a new script.

Example `POST /api/v1/scripts` body:

```json
{
  "name": "Get Top Processes",
  "description": "List the top 3 processes by memory usage",
  "language": "powershell",
  "content": "Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 3 | Format-Table -AutoSize"
}
```

### Using scripts with device actions

The Device Actions API supports both inline payloads and script references:

`POST /api/v1/devices/{device_id}/actions`

Inline:

```json
{
  "type": "powershell_inline",
  "payload": "Get-Process | Select-Object -First 3"
}
```

Script library:

```json
{
  "type": "powershell_inline",
  "script_id": 1
}
```

If `script_id` is provided, the backend loads the script content and stores it in the action payload before it is sent to the agent.

## OS Awareness

- Devices track an optional `os_type` (for example: `windows`, `linux`, `proxmox`).
- Scripts can set an optional `target_os_type` to hint which platforms they support; the Device Actions API rejects mismatched script/device OS combinations when both are specified.
- The Windows agent registers with `os_type="windows"` by default and includes OS description details in its registration payload.

## Deployment Profiles

Deployment profiles group ordered tasks that can be applied to one or more devices. Profiles can also be stored as templates (using the `is_template` flag) and later instantiated into regular profiles for editing and application.

Key fields:

- `DeploymentProfile`: `name`, `description`, `target_os_type`, `is_template`, timestamps.
- `ProfileTask`: `name`, `description`, `order_index`, `action_type` (e.g. `powershell_inline`), `script_id`, `continue_on_error`, timestamps.

### Deployment Profile API

- `GET /api/v1/profiles` – list profiles.
- `POST /api/v1/profiles` – create a profile (`name`, optional `description`, optional `target_os_type`).
- `GET /api/v1/profiles/{id}` – get a profile with its tasks.
- `GET /api/v1/profiles/{id}/tasks` – list tasks for a profile.
- `POST /api/v1/profiles/{id}/tasks` – add a task (supports `script_id` and `action_type`).
- `POST /api/v1/profiles/{id}/apply` – apply a profile to one or more devices by creating pending actions for each task.

Example bodies:

Create profile:

```json
{
  "name": "Windows Baseline",
  "description": "Bootstrap and harden a Windows endpoint",
  "target_os_type": "windows"
}
```

Add task:

```json
{
  "name": "Install agent",
  "order_index": 10,
  "action_type": "powershell_inline",
  "script_id": 1,
  "continue_on_error": true
}
```

Apply profile to a device:

```json
{
  "device_ids": [1]
}
```

## Templates

Templates reuse the deployment profile model with `is_template = true` and can be cloned into editable profiles.

### Template API

- `GET /api/v1/templates` – list templates.
- `GET /api/v1/templates/{id}` – get a template (including tasks).
- `POST /api/v1/templates/{id}/instantiate` – clone a template into a regular deployment profile (optionally overriding `name` and `description`).

### Dev SQLite reset

If SQLAlchemy models change and you see `sqlite3 no such column` errors locally, you can reset the development SQLite database (destructive) and recreate tables from the current models:

```bash
cd backend
python -m scripts.reset_dev_db
```

Use this only for local development databases where data loss is acceptable.

### Default Enrollment Token (Development)

On application startup, the backend seeds a default enrollment token if it does not already exist:

- Token value: `changeme` (configured by `default_enrollment_token` in `app/core/config.py`)

The DeployFlow agent development configuration uses this token by default in `appsettings.json`. For production, change this value in both the backend settings and agent config, and manage tokens via a proper admin workflow.

### Pydantic v2 Compatibility

The backend uses Pydantic v2:

- Settings are provided by `pydantic-settings.BaseSettings` in `app/core/config.py`.
- Schemas use `model_config = ConfigDict(from_attributes=True)` instead of `orm_mode = True`.
