using DeployFlow.Agent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.Configure<AgentConfig>(builder.Configuration.GetSection("Agent"));
builder.Services.AddHttpClient<AgentApiClient>();
builder.Services.AddHostedService<AgentService>();

var host = builder.Build();
host.Run();
