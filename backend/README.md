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

### Default Enrollment Token (Development)

On application startup, the backend seeds a default enrollment token if it does not already exist:

- Token value: `changeme` (configured by `default_enrollment_token` in `app/core/config.py`)

The DeployFlow agent development configuration uses this token by default in `appsettings.json`. For production, change this value in both the backend settings and agent config, and manage tokens via a proper admin workflow.

### Pydantic v2 Compatibility

The backend uses Pydantic v2:

- Settings are provided by `pydantic-settings.BaseSettings` in `app/core/config.py`.
- Schemas use `model_config = ConfigDict(from_attributes=True)` instead of `orm_mode = True`.
