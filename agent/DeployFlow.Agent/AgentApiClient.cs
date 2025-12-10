using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DeployFlow.Agent;

public class AgentApiClient
{
    private readonly HttpClient _httpClient;
    private readonly AgentConfig _config;
    private readonly ILogger<AgentApiClient> _logger;

    public AgentApiClient(HttpClient httpClient, IOptions<AgentConfig> config, ILogger<AgentApiClient> logger)
    {
        _httpClient = httpClient;
        _config = config.Value;
        _logger = logger;
        _httpClient.BaseAddress = new Uri(_config.BackendBaseUrl);
    }

    public async Task<AgentRegisterResponse?> RegisterAsync(string hostname, string? osVersion = null, string? hardwareSummary = null, CancellationToken cancellationToken = default)
    {
        var request = new AgentRegisterRequest
        {
            EnrollmentToken = _config.EnrollmentToken,
            Hostname = hostname,
            OsVersion = osVersion,
            HardwareSummary = hardwareSummary
        };

        var response = await _httpClient.PostAsJsonAsync("/api/v1/agent/register", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Agent register failed with status {StatusCode}", response.StatusCode);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<AgentRegisterResponse>(cancellationToken: cancellationToken);
    }

    public async Task<AgentHeartbeatResponse?> HeartbeatAsync(int deviceId, CancellationToken cancellationToken = default)
    {
        var request = new AgentHeartbeatRequest
        {
            DeviceId = deviceId,
            Status = "online"
        };

        var response = await _httpClient.PostAsJsonAsync("/api/v1/agent/heartbeat", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Heartbeat failed with status {StatusCode}", response.StatusCode);
            return null;
        }

        return await response.Content.ReadFromJsonAsync<AgentHeartbeatResponse>(cancellationToken: cancellationToken);
    }

    public async Task<bool> SendActionResultAsync(int actionId, string status, int? exitCode, string? logs, CancellationToken cancellationToken = default)
    {
        var request = new AgentActionResultRequest
        {
            Status = status,
            ExitCode = exitCode,
            Logs = logs
        };

        var response = await _httpClient.PostAsJsonAsync($"/api/v1/agent/actions/{actionId}/result", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Posting action result for {ActionId} failed with {StatusCode}", actionId, response.StatusCode);
            return false;
        }

        return true;
    }
}
