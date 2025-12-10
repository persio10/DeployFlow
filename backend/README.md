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

These endpoints enable the DeployFlow Windows agent to execute scripts and software installs on managed devices.
