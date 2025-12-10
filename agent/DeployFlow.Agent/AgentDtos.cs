namespace DeployFlow.Agent;

public class AgentRegisterRequest
{
    public string EnrollmentToken { get; set; } = string.Empty;
    public string Hostname { get; set; } = string.Empty;
    public string? OsVersion { get; set; }
    public string? HardwareSummary { get; set; }
}

public class AgentRegisterResponse
{
    public int DeviceId { get; set; }
    public int PollIntervalSeconds { get; set; }
}

public class AgentHeartbeatRequest
{
    public int DeviceId { get; set; }
    public string Status { get; set; } = "online";
    public string? OsVersion { get; set; }
    public string? HardwareSummary { get; set; }
}

public class AgentActionPayload
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Payload { get; set; }
}

public class AgentHeartbeatResponse
{
    public List<AgentActionPayload> Actions { get; set; } = new();
}

public class AgentActionResultRequest
{
    public string Status { get; set; } = string.Empty;
    public int? ExitCode { get; set; }
    public string? Logs { get; set; }
}
