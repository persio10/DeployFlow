namespace DeployFlow.Agent;

public class AgentConfig
{
    public string BackendBaseUrl { get; set; } = "http://localhost:8000";
    public string EnrollmentToken { get; set; } = "changeme";
    public int PollIntervalSeconds { get; set; } = 30;
    public string DeviceStateFile { get; set; } = "device_state.json";
}
