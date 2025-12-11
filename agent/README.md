# DeployFlow Fleet Agent

Windows-oriented .NET 8 Worker Service that registers with the DeployFlow backend, heartbeats for pending actions, executes PowerShell inline scripts, and reports results.

## Running in Debug
```bash
cd agent/DeployFlow.Agent
dotnet run
```
- Requires .NET 8 SDK.
- Configuration comes from `appsettings.json` (override via environment/user secrets if desired):
  - `Agent.BackendBaseUrl` (default `http://localhost:8000`)
  - `Agent.EnrollmentToken` (default `changeme` for dev)
  - `Agent.PollIntervalSeconds` (default 30)
  - `Agent.DeviceStateFile` (default `device_state.json`)

## Backend Integration
- Register: `POST /api/v1/agent/register` (reactivates soft-deleted devices, captures OS info).
- Heartbeat: `POST /api/v1/agent/heartbeat` (updates status/check-in, returns pending actions; 404/410 triggers re-registration).
- Action result: `POST /api/v1/agent/actions/{action_id}/result`.
- Cached device id is stored in `device_state.json`; if heartbeat returns 404/410, the agent clears the cache, re-registers, saves the new id, and resumes polling.

## Action Handling
- `test`: no-op success used for connectivity checks.
- `powershell_inline`: writes payload to a temp `.ps1`, executes via `powershell.exe`, captures stdout/stderr, and reports exit code/logs.
- `agent_uninstall`: best-effort stub; logs the request and reports success (placeholder for future uninstall steps).

## Architecture Notes
- Implemented as a Worker Service (`Microsoft.NET.Sdk.Worker`); entrypoint uses `Host.CreateApplicationBuilder` to wire options, HttpClient, and `AgentService`.
- `DeviceStateStore` handles JSON persistence of the device id between runs.
- Logs surface registration, heartbeat, action processing, and re-registration events for troubleshooting.
