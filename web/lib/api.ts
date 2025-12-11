import type { TargetOsType } from './osTypes'

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export type { TargetOsType } from './osTypes'
export type ScriptLanguage = 'powershell' | 'bash'

export interface Device {
  id: number
  hostname: string
  status: string
  os_type?: TargetOsType | null
  os_version?: string | null
  last_check_in?: string | null
  hardware_summary?: string | null
  profile_id?: number | null
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

export interface Action {
  id: number
  device_id: number
  type: string
  status: string
  payload?: string | null
  script_id?: number | null
  logs?: string | null
  exit_code?: number | null
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface Script {
  id: number
  name: string
  description?: string | null
  language: ScriptLanguage
  target_os_type?: TargetOsType | null
  content: string
  created_at: string
  updated_at: string
}

export interface ScriptCreateInput {
  name: string
  description?: string | null
  language?: ScriptLanguage
  target_os_type?: TargetOsType | null
  content: string
}

export interface ScriptUpdateInput {
  name?: string
  description?: string | null
  language?: ScriptLanguage
  target_os_type?: TargetOsType | null
  content?: string
}

export interface DeploymentProfile {
  id: number
  name: string
  description?: string | null
  target_os_type?: TargetOsType | null
  is_template: boolean
  created_at: string
  updated_at: string
}

export interface DeploymentProfileCreateInput {
  name: string
  description?: string | null
  target_os_type?: TargetOsType | null
  is_template?: boolean
}

export interface DeploymentProfileUpdateInput {
  name?: string
  description?: string | null
  target_os_type?: TargetOsType | null
  is_template?: boolean
}

export interface ProfileTask {
  id: number
  profile_id: number
  name: string
  description?: string | null
  order_index: number
  action_type: string
  script_id?: number | null
  continue_on_error: boolean
  created_at: string
  updated_at: string
}

export interface ProfileTaskCreateInput {
  name: string
  description?: string | null
  order_index?: number
  action_type?: string
  script_id?: number | null
  continue_on_error?: boolean
}

export interface ProfileTaskUpsertInput extends ProfileTaskCreateInput {
  id?: number
}

export interface DeploymentProfileWithTasks extends DeploymentProfile {
  tasks: ProfileTask[]
}

export interface TemplateInstantiateBody {
  name?: string
  description?: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    const message = text || res.statusText
    throw new Error(`API error (${res.status}): ${message}`)
  }
  return res.json() as Promise<T>
}

export async function fetchDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/devices`, { cache: 'no-store' })
  return handleResponse<Device[]>(res)
}

export async function fetchDevice(deviceId: number): Promise<Device> {
  const res = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}`, { cache: 'no-store' })
  return handleResponse<Device>(res)
}

export async function deleteDevice(deviceId: number): Promise<{ status: number }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}`, { method: 'DELETE' })

  if (res.status === 404 || res.status === 410) {
    return { status: res.status }
  }

  if (!res.ok) {
    const text = await res.text()
    const message = text || res.statusText
    throw new Error(`API error (${res.status}): ${message}`)
  }

  return { status: res.status }
}

export async function fetchDeviceActions(deviceId: number): Promise<Action[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}/actions`, { cache: 'no-store' })
  return handleResponse<Action[]>(res)
}

export async function createDeviceAction(
  deviceId: number,
  body: { type: string; payload?: string | null; script_id?: number | null }
): Promise<Action> {
  const res = await fetch(`${API_BASE_URL}/api/v1/devices/${deviceId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Action>(res)
}

export async function fetchScripts(): Promise<Script[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/scripts`, { cache: 'no-store' })
  return handleResponse<Script[]>(res)
}

export async function fetchScript(scriptId: number): Promise<Script> {
  const res = await fetch(`${API_BASE_URL}/api/v1/scripts/${scriptId}`, { cache: 'no-store' })
  return handleResponse<Script>(res)
}

export async function createScript(body: ScriptCreateInput): Promise<Script> {
  const res = await fetch(`${API_BASE_URL}/api/v1/scripts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Script>(res)
}

export async function updateScript(scriptId: number, body: ScriptUpdateInput): Promise<Script> {
  const res = await fetch(`${API_BASE_URL}/api/v1/scripts/${scriptId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Script>(res)
}

export async function deleteScript(scriptId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/scripts/${scriptId}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    const message = text || res.statusText
    throw new Error(`API error (${res.status}): ${message}`)
  }
}

export async function fetchProfiles(): Promise<DeploymentProfile[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles`, { cache: 'no-store' })
  return handleResponse<DeploymentProfile[]>(res)
}

export async function createProfile(body: DeploymentProfileCreateInput): Promise<DeploymentProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<DeploymentProfile>(res)
}

export async function updateProfile(
  profileId: number,
  body: DeploymentProfileUpdateInput
): Promise<DeploymentProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<DeploymentProfile>(res)
}

export async function fetchProfile(profileId: number): Promise<DeploymentProfileWithTasks> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}`, { cache: 'no-store' })
  return handleResponse<DeploymentProfileWithTasks>(res)
}

export async function deleteProfile(profileId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    const message = text || res.statusText
    throw new Error(`API error (${res.status}): ${message}`)
  }
}

export async function createProfileTask(
  profileId: number,
  body: ProfileTaskCreateInput
): Promise<ProfileTask> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<ProfileTask>(res)
}

export async function replaceProfileTasks(
  profileId: number,
  tasks: ProfileTaskUpsertInput[]
): Promise<ProfileTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}/tasks/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  })
  return handleResponse<ProfileTask[]>(res)
}

export async function fetchProfileTasks(profileId: number): Promise<ProfileTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}/tasks`, { cache: 'no-store' })
  return handleResponse<ProfileTask[]>(res)
}

export async function fetchTemplateTasks(templateId: number): Promise<ProfileTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}/tasks`, { cache: 'no-store' })
  return handleResponse<ProfileTask[]>(res)
}

export async function applyProfile(profileId: number, deviceId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${profileId}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId] }),
  })
  await handleResponse<{ created_actions: number }>(res)
}

export async function fetchTemplates(): Promise<DeploymentProfile[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates`, { cache: 'no-store' })
  return handleResponse<DeploymentProfile[]>(res)
}

export async function fetchTemplate(templateId: number): Promise<DeploymentProfileWithTasks> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, { cache: 'no-store' })
  return handleResponse<DeploymentProfileWithTasks>(res)
}

export async function instantiateTemplate(
  templateId: number,
  body: TemplateInstantiateBody
): Promise<DeploymentProfileWithTasks> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}/instantiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<DeploymentProfileWithTasks>(res)
}

export async function updateTemplate(
  templateId: number,
  body: DeploymentProfileUpdateInput
): Promise<DeploymentProfile> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<DeploymentProfile>(res)
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}`, { method: 'DELETE' })
  if (!res.ok) {
    const text = await res.text()
    const message = text || res.statusText
    throw new Error(`API error (${res.status}): ${message}`)
  }
}

export async function replaceTemplateTasks(
  templateId: number,
  tasks: ProfileTaskUpsertInput[]
): Promise<ProfileTask[]> {
  const res = await fetch(`${API_BASE_URL}/api/v1/templates/${templateId}/tasks/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tasks }),
  })
  return handleResponse<ProfileTask[]>(res)
}
