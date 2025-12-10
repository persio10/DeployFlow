using System;
using System.Diagnostics;
using System.IO;
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
    public static async Task<PowerShellExecutionResult> RunScriptAsync(string script, CancellationToken cancellationToken = default)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "DeployFlow", "Scripts");
        Directory.CreateDirectory(tempDir);

        var scriptFileName = $"{Guid.NewGuid():N}.ps1";
        var scriptPath = Path.Combine(tempDir, scriptFileName);
        await File.WriteAllTextAsync(scriptPath, script, cancellationToken);

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"{scriptPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            var process = new Process
            {
                StartInfo = psi,
                EnableRaisingEvents = true
            };

            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (_, e) =>
            {
                if (e.Data != null)
                {
                    outputBuilder.AppendLine(e.Data);
                }
            };

            process.ErrorDataReceived += (_, e) =>
            {
                if (e.Data != null)
                {
                    errorBuilder.AppendLine(e.Data);
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            try
            {
                while (!process.HasExited)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        try
                        {
                            process.Kill();
                        }
                        catch
                        {
                            // ignore
                        }

                        break;
                    }

                    await Task.Delay(100, cancellationToken);
                }
            }
            catch (TaskCanceledException)
            {
                try
                {
                    if (!process.HasExited)
                    {
                        process.Kill();
                    }
                }
                catch
                {
                    // ignore cleanup failures
                }
            }

            if (!process.HasExited)
            {
                process.WaitForExit();
            }

            var exitCode = process.ExitCode;

            return new PowerShellExecutionResult
            {
                ExitCode = exitCode,
                Output = outputBuilder.ToString().Trim(),
                Error = errorBuilder.ToString().Trim()
            };
        }
        finally
        {
            try
            {
                if (File.Exists(scriptPath))
                {
                    File.Delete(scriptPath);
                }
            }
            catch
            {
                // ignore cleanup failures
            }
        }
    }
}
