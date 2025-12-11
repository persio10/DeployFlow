# DeployFlow Fleet Agent

This is the Windows agent for DeployFlow Fleet.

## Running in Debug

```bash
cd agent/DeployFlow.Agent
dotnet run
```

## Backend Integration

The agent now integrates with the DeployFlow backend via the agent API:

- `POST /api/v1/agent/register` to register with an enrollment token and obtain a device id.
- `POST /api/v1/agent/heartbeat` to send heartbeats and receive pending actions.
- `POST /api/v1/agent/actions/{action_id}/result` to report execution results.

Device id is cached locally in `device_state.json` (path configurable in `Agent.DeviceStateFile`), and heartbeats run on a configurable interval (default 30 seconds).

If the backend returns `404 Device not found` during a heartbeat (for example, if devices are purged server-side), the agent automatically re-registers and updates the cached device id before resuming normal heartbeats.

### .NET Worker Service

The DeployFlow.Agent project is implemented as a .NET Worker Service:

- `DeployFlow.Agent.csproj` uses the `Microsoft.NET.Sdk.Worker` SDK.
- `Program.cs` uses `Host.CreateApplicationBuilder` to configure services and run `AgentService`.
- Agent logic lives in `AgentService` and `AgentApiClient`, using `Microsoft.Extensions.Hosting`, `Microsoft.Extensions.Logging`, and `Microsoft.Extensions.Options`.

### Supported Action Types

- `test`  
  No-op test that always succeeds. Useful for verifying connectivity.

- `powershell_inline`  
  Runs the `payload` as a PowerShell script on the local machine (Windows only). Output and errors are captured and sent back in the action result logs.
