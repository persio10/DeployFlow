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
