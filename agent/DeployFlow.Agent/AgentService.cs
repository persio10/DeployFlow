using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DeployFlow.Agent;

public class AgentService(ILogger<AgentService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("DeployFlow Agent starting...");

        while (!stoppingToken.IsCancellationRequested)
        {
            logger.LogInformation("Heartbeat tick (stub)");
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}
