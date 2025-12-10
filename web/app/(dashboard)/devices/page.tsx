const devices = [
  { hostname: 'win10-lab-01', status: 'Online', profile: 'Standard Windows 11 Office PC' },
  { hostname: 'branch-srv-02', status: 'Offline', profile: 'Server Baseline' },
  { hostname: 'intune-test-03', status: 'Online', profile: 'Pilot Template' },
]

export default function DevicesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Devices</h1>
        <p className="text-sm text-zinc-400">Enrolled endpoints reporting in via the DeployFlow agent.</p>
      </div>
      <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Hostname</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-zinc-300">Profile</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {devices.map((device) => (
              <tr key={device.hostname} className="hover:bg-zinc-800/40">
                <td className="px-4 py-3 text-sm">{device.hostname}</td>
                <td className="px-4 py-3 text-sm text-emerald-400">{device.status}</td>
                <td className="px-4 py-3 text-sm text-zinc-200">{device.profile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
