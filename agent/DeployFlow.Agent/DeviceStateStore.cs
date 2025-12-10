using System.IO;
using System.Text.Json;

namespace DeployFlow.Agent;

public class DeviceState
{
    public int DeviceId { get; set; }
}

public class DeviceStateStore
{
    private readonly string _filePath;

    public DeviceStateStore(string filePath)
    {
        _filePath = filePath;
    }

    public DeviceState? Load()
    {
        if (!File.Exists(_filePath))
        {
            return null;
        }

        var json = File.ReadAllText(_filePath);
        return JsonSerializer.Deserialize<DeviceState>(json);
    }

    public void Save(DeviceState state)
    {
        var json = JsonSerializer.Serialize(state);
        File.WriteAllText(_filePath, json);
    }
}
