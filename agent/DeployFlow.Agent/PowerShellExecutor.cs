using System;
using System.Management.Automation;
using System.Management.Automation.Runspaces;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace DeployFlow.Agent;

public class PowerShellExecutionResult
{
    public int ExitCode { get; set; }
    public string Output { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
}

public static class PowerShellExecutor
{
    public static Task<PowerShellExecutionResult> RunScriptAsync(string script, CancellationToken cancellationToken = default)
    {
        return Task.Run(() =>
        {
            using var runspace = RunspaceFactory.CreateRunspace();
            runspace.Open();

            using var ps = PowerShell.Create();
            ps.Runspace = runspace;
            ps.AddScript(script);

            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            var outputCollection = new PSDataCollection<PSObject>();
            outputCollection.DataAdded += (_, args) =>
            {
                var item = outputCollection[args.Index];
                outputBuilder.AppendLine(item.ToString());
            };

            ps.Streams.Error.DataAdded += (_, args) =>
            {
                var item = ps.Streams.Error[args.Index];
                errorBuilder.AppendLine(item.ToString());
            };

            IAsyncResult asyncResult = ps.BeginInvoke<PSObject, PSObject>(null, outputCollection);

            while (!asyncResult.IsCompleted)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    try
                    {
                        ps.Stop();
                    }
                    catch
                    {
                        // ignore
                    }

                    break;
                }

                Thread.Sleep(50);
            }

            ps.EndInvoke(asyncResult);

            int exitCode = ps.HadErrors ? 1 : 0;

            return new PowerShellExecutionResult
            {
                ExitCode = exitCode,
                Output = outputBuilder.ToString().Trim(),
                Error = errorBuilder.ToString().Trim()
            };
        }, cancellationToken);
    }
}
