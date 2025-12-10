using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace DeployFlow.Agent;

public class AgentRegisterRequest
{
    [JsonPropertyName("enrollment_token")]
    public string EnrollmentToken { get; set; } = string.Empty;

    [JsonPropertyName("hostname")]
    public string Hostname { get; set; } = string.Empty;

    [JsonPropertyName("os_version")]
    public string? OsVersion { get; set; }

    [JsonPropertyName("hardware_summary")]
    public string? HardwareSummary { get; set; }

    [JsonPropertyName("os_type")]
    public string? OsType { get; set; }

    [JsonPropertyName("os_description")]
    public string? OsDescription { get; set; }
}

public class AgentRegisterResponse
{
    [JsonPropertyName("device_id")]
    public int DeviceId { get; set; }

    [JsonPropertyName("poll_interval_seconds")]
    public int PollIntervalSeconds { get; set; }
}

public class AgentHeartbeatRequest
{
    [JsonPropertyName("device_id")]
    public int DeviceId { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "online";

    [JsonPropertyName("os_version")]
    public string? OsVersion { get; set; }

    [JsonPropertyName("hardware_summary")]
    public string? HardwareSummary { get; set; }
}

public class AgentActionPayload
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("payload")]
    public string? Payload { get; set; }
}

public class AgentHeartbeatResponse
{
    [JsonPropertyName("actions")]
    public List<AgentActionPayload> Actions { get; set; } = new();
}

public class AgentActionResultRequest
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("exit_code")]
    public int? ExitCode { get; set; }

    [JsonPropertyName("logs")]
    public string? Logs { get; set; }

    [JsonPropertyName("completed_at")]
    public DateTime? CompletedAt { get; set; }
}
