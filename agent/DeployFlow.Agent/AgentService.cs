using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DeployFlow.Agent;

public class AgentService : BackgroundService
{
    private readonly AgentApiClient _apiClient;
    private readonly AgentConfig _config;
    private readonly ILogger<AgentService> _logger;
    private readonly DeviceStateStore _stateStore;
    private int _deviceId;

    public AgentService(
        AgentApiClient apiClient,
        IOptions<AgentConfig> config,
        ILogger<AgentService> logger)
    {
        _apiClient = apiClient;
        _config = config.Value;
        _logger = logger;
        _stateStore = new DeviceStateStore(_config.DeviceStateFile);
    }

    public override async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("DeployFlow Agent starting...");

        var state = _stateStore.Load();
        if (state != null)
        {
            _deviceId = state.DeviceId;
            _logger.LogInformation("Loaded existing device id: {DeviceId}", _deviceId);
        }
        else
        {
            var hostname = Environment.MachineName;
            var osDescription = RuntimeInformation.OSDescription;
            var registerResponse = await _apiClient.RegisterAsync(
                hostname,
                osVersion: Environment.OSVersion.VersionString,
                hardwareSummary: null,
                osType: "windows",
                osDescription: osDescription,
                cancellationToken: cancellationToken);
            if (registerResponse == null)
            {
                _logger.LogError("Failed to register agent. Stopping.");
                throw new Exception("Registration failed");
            }

            _deviceId = registerResponse.DeviceId;
            _stateStore.Save(new DeviceState { DeviceId = _deviceId });
            _logger.LogInformation("Registered new device id: {DeviceId}", _deviceId);

            if (registerResponse.PollIntervalSeconds > 0)
            {
                _config.PollIntervalSeconds = registerResponse.PollIntervalSeconds;
            }
        }

        await base.StartAsync(cancellationToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Sending heartbeat for device {DeviceId}", _deviceId);

            var heartbeatResponse = await _apiClient.HeartbeatAsync(_deviceId, stoppingToken);

            if (heartbeatResponse?.Actions != null && heartbeatResponse.Actions.Count > 0)
            {
                foreach (var action in heartbeatResponse.Actions)
                {
                    _logger.LogInformation("Received action {ActionId} of type {Type}", action.Id, action.Type);

                    string status;
                    int exitCode;
                    string logs;

                    if (string.Equals(action.Type, "test", StringComparison.OrdinalIgnoreCase))
                    {
                        status = "succeeded";
                        exitCode = 0;
                        logs = $"Test action executed on {Environment.MachineName} at {DateTimeOffset.UtcNow}. Payload: {action.Payload ?? "(none)"}";
                    }
                    else if (string.Equals(action.Type, "powershell_inline", StringComparison.OrdinalIgnoreCase))
                    {
                        if (string.IsNullOrWhiteSpace(action.Payload))
                        {
                            status = "failed";
                            exitCode = 1;
                            logs = "powershell_inline action had empty payload.";
                        }
                        else
                        {
                            try
                            {
                                _logger.LogInformation("Executing PowerShell script for action {ActionId}", action.Id);
                                var result = await PowerShellExecutor.RunScriptAsync(action.Payload, stoppingToken);

                                exitCode = result.ExitCode;
                                status = exitCode == 0 ? "succeeded" : "failed";

                                var combined = new StringBuilder();
                                if (!string.IsNullOrWhiteSpace(result.Output))
                                {
                                    combined.AppendLine("=== STDOUT ===");
                                    combined.AppendLine(result.Output.Trim());
                                }
                                if (!string.IsNullOrWhiteSpace(result.Error))
                                {
                                    combined.AppendLine("=== STDERR ===");
                                    combined.AppendLine(result.Error.Trim());
                                }

                                logs = combined.ToString().Trim();
                                if (string.IsNullOrWhiteSpace(logs))
                                {
                                    logs = "(no output)";
                                }
                            }
                            catch (Exception ex)
                            {
                                status = "failed";
                                exitCode = 1;
                                logs = $"Exception during PowerShell execution: {ex}";
                                _logger.LogError(ex, "Error executing PowerShell script for action {ActionId}", action.Id);
                            }
                        }
                    }
                    else
                    {
                        status = "failed";
                        exitCode = 1;
                        logs = $"Unsupported action type: {action.Type}. Payload: {action.Payload ?? "(none)"}";
                        _logger.LogWarning("Unsupported action type {Type} for action {ActionId}", action.Type, action.Id);
                    }

                    await _apiClient.SendActionResultAsync(
                        action.Id,
                        status,
                        exitCode,
                        logs,
                        stoppingToken);
                }
            }

            await Task.Delay(TimeSpan.FromSeconds(_config.PollIntervalSeconds), stoppingToken);
        }
    }
}
