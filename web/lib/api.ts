export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'

export interface Device {
  id: number
  hostname: string
  status: string
  os_version?: string | null
  last_check_in?: string | null
  hardware_summary?: string | null
  profile_id?: number | null
  created_at?: string
  updated_at?: string
}

export interface Action {
  id: number
  device_id: number
  type: string
  status: string
  payload?: string | null
  logs?: string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
}

export interface Script {
  id: number
  name: string
  description?: string | null
  language: string
  content: string
  created_at: string
  updated_at: string
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
