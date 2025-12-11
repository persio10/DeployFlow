export type TargetOsType =
  | 'windows'
  | 'windows_server'
  | 'ubuntu'
  | 'debian'
  | 'proxmox'
  | 'rhel'
  | 'centos'
  | 'macos'
  | 'other'

type OsOption = { value: TargetOsType; label: string }

export const TARGET_OS_OPTIONS: OsOption[] = [
  { value: 'windows', label: 'Windows' },
  { value: 'windows_server', label: 'Windows Server' },
  { value: 'ubuntu', label: 'Ubuntu' },
  { value: 'debian', label: 'Debian' },
  { value: 'proxmox', label: 'Proxmox' },
  { value: 'rhel', label: 'RHEL' },
  { value: 'centos', label: 'CentOS' },
  { value: 'macos', label: 'macOS' },
  { value: 'other', label: 'Other / Generic' },
]

export function formatTargetOs(value?: TargetOsType | string | null): string {
  if (!value) return 'Any OS'
  const match = TARGET_OS_OPTIONS.find((opt) => opt.value === value)
  return match ? match.label : value
}
