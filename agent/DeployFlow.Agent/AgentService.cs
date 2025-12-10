using System;
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
            var registerResponse = await _apiClient.RegisterAsync(hostname, cancellationToken: cancellationToken);
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

                    await _apiClient.SendActionResultAsync(
                        action.Id,
                        status: "succeeded",
                        exitCode: 0,
                        logs: "Stub execution - not implemented yet",
                        cancellationToken: stoppingToken);
                }
            }

            await Task.Delay(TimeSpan.FromSeconds(_config.PollIntervalSeconds), stoppingToken);
        }
    }
}
