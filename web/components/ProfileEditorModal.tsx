'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createProfile,
  fetchProfile,
  fetchScripts,
  fetchTemplate,
  replaceProfileTasks,
  replaceTemplateTasks,
  updateProfile,
  updateTemplate,
  DeploymentProfileCreateInput,
  DeploymentProfile,
  DeploymentProfileWithTasks,
  DeploymentProfileUpdateInput,
  ProfileTask,
  ProfileTaskUpsertInput,
  Script,
  TargetOsType,
} from '@/lib/api'
import { TARGET_OS_OPTIONS } from '@/lib/osTypes'

export type ProfileEditorMode = 'profile' | 'template'
export type ProfileEditorVariant = 'create' | 'edit'

interface ProfileEditorModalProps {
  open: boolean
  mode?: ProfileEditorMode
  variant?: ProfileEditorVariant
  initialProfile?: DeploymentProfile | DeploymentProfileWithTasks | null
  initialTasks?: ProfileTask[]
  onClose: () => void
  onCreated?: (profileId: number) => void
  onSaved?: (profile: DeploymentProfileWithTasks) => void
}

interface TaskInput extends Omit<ProfileTaskUpsertInput, 'order_index'> {
  order_index?: number
  localId: string
}

function defaultTask(order: number): TaskInput {
  return {
    localId: crypto.randomUUID(),
    name: `Task ${order + 1}`,
    description: '',
    order_index: order,
    action_type: 'powershell_inline',
    script_id: undefined,
    continue_on_error: true,
  }
}

function mapTasksFromApi(tasks?: ProfileTask[]): TaskInput[] {
  if (!tasks) return [defaultTask(0)]
  const sorted = [...tasks].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  return sorted.map((task, idx) => ({
    localId: crypto.randomUUID(),
    id: task.id,
    name: task.name,
    description: task.description ?? '',
    order_index: task.order_index ?? idx,
    action_type: task.action_type,
    script_id: task.script_id ?? undefined,
    continue_on_error: task.continue_on_error,
  }))
}

function normalizeOrder(tasks: TaskInput[]): TaskInput[] {
  return tasks.map((task, idx) => ({ ...task, order_index: idx }))
}

export function ProfileEditorModal({
  open,
  onClose,
  onCreated,
  onSaved,
  mode = 'profile',
  variant = 'create',
  initialProfile,
  initialTasks,
}: ProfileEditorModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetOsType, setTargetOsType] = useState<TargetOsType | ''>('')
  const [isTemplate, setIsTemplate] = useState<boolean>(mode === 'template')
  const [tasks, setTasks] = useState<TaskInput[]>([defaultTask(0)])

  const [scripts, setScripts] = useState<Script[]>([])
  const [loadingScripts, setLoadingScripts] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const title = useMemo(() => {
    if (variant === 'edit') {
      return mode === 'template' ? 'Edit Template' : 'Edit Profile'
    }
    return mode === 'template' ? 'New Template' : 'New Profile'
  }, [mode, variant])

  useEffect(() => {
    if (!open) return

    const load = async () => {
      setError(null)
      setSubmitting(false)
      setLoadingScripts(true)
      try {
        const data = await fetchScripts()
        setScripts(data)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load scripts'
        setError(message)
      } finally {
        setLoadingScripts(false)
      }

      if (variant === 'edit' && initialProfile) {
        setLoadingProfile(true)
        try {
          const loader =
            mode === 'template' || initialProfile.is_template
              ? () => fetchTemplate(initialProfile.id)
              : () => fetchProfile(initialProfile.id)
          const fullProfile = await loader()
          const taskSource = initialTasks ?? fullProfile.tasks ?? []

          setName(fullProfile.name)
          setDescription(fullProfile.description ?? '')
          setTargetOsType(fullProfile.target_os_type ?? '')
          setIsTemplate(fullProfile.is_template)
          setTasks(normalizeOrder(mapTasksFromApi(taskSource.length ? taskSource : fullProfile.tasks)))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to load profile'
          setError(message)
        } finally {
          setLoadingProfile(false)
        }
      } else {
        setName('')
        setDescription('')
        setTargetOsType('')
        setIsTemplate(mode === 'template')
        setTasks([defaultTask(0)])
      }
    }

    load()
  }, [initialProfile, mode, open, variant])

  const updateTask = (localId: string, updates: Partial<TaskInput>) => {
    setTasks((prev) => normalizeOrder(prev.map((task) => (task.localId === localId ? { ...task, ...updates } : task))))
  }

  const addTask = () => {
    setTasks((prev) => normalizeOrder([...prev, defaultTask(prev.length)]))
  }

  const removeTask = (localId: string) => {
    setTasks((prev) => {
      if (prev.length === 1) return prev
      return normalizeOrder(prev.filter((task) => task.localId !== localId))
    })
  }

  const moveTask = (localId: string, direction: 'up' | 'down') => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.localId === localId)
      if (idx === -1) return prev
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return normalizeOrder(next)
    })
  }

  const preparedTasks = () => {
    const sorted = normalizeOrder(tasks)
    return sorted.map((task, idx) => ({
      name: task.name?.trim() || `Task ${idx + 1}`,
      description: task.description?.trim() || undefined,
      order_index: idx,
      action_type: task.action_type || 'powershell_inline',
      script_id: task.script_id ?? undefined,
      continue_on_error: task.continue_on_error ?? true,
    }))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const basePayload: DeploymentProfileCreateInput | DeploymentProfileUpdateInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        target_os_type: targetOsType || undefined,
        is_template: mode === 'template' ? true : isTemplate,
      }

      if (variant === 'edit' && initialProfile) {
        const updater =
          mode === 'template' || initialProfile.is_template ? updateTemplate : updateProfile
        const tasksSaver =
          mode === 'template' || initialProfile.is_template
            ? replaceTemplateTasks
            : replaceProfileTasks

        const updatedProfile = await updater(initialProfile.id, basePayload)
        const savedTasks = await tasksSaver(initialProfile.id, preparedTasks())
        const combined: DeploymentProfileWithTasks = { ...updatedProfile, tasks: savedTasks }
        setTasks(normalizeOrder(mapTasksFromApi(savedTasks)))
        onSaved?.(combined)
        onClose()
        return
      }

      const profile = await createProfile(basePayload as DeploymentProfileCreateInput)
      const savedTasks = await replaceProfileTasks(profile.id, preparedTasks())
      const combined: DeploymentProfileWithTasks = { ...profile, tasks: savedTasks }
      onCreated?.(profile.id)
      onSaved?.(combined)
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-xs text-zinc-400">Build a task sequence from library scripts.</p>
          </div>
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm text-zinc-200">
          {error && <div className="rounded-md bg-rose-500/10 px-3 py-2 text-rose-200">{error}</div>}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs uppercase tracking-wide text-zinc-400">Target OS</span>
              <select
                value={targetOsType}
                onChange={(e) => setTargetOsType(e.target.value as TargetOsType | '')}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">Any</option>
                {TARGET_OS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-zinc-400">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[90px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          {mode === 'profile' && (
            <label className="flex items-center gap-2 text-sm text-zinc-200">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-blue-500 focus:ring-blue-500"
              />
              <span>Save as template</span>
            </label>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Tasks</p>
                <p className="text-xs text-zinc-400">
                  Tasks run in order and will be queued as device actions when the profile is applied.
                </p>
              </div>
              <button
                onClick={addTask}
                className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
              >
                Add task
              </button>
            </div>

            {loadingProfile && (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400">
                Loading tasks…
              </div>
            )}

            <div className="space-y-3">
              {tasks.map((task, idx) => (
                <div key={task.localId} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>
                      Task {idx + 1}
                      {task.action_type ? ` · ${task.action_type}` : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveTask(task.localId, 'up')}
                        className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveTask(task.localId, 'down')}
                        className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-200 hover:bg-zinc-800"
                      >
                        ↓
                      </button>
                      {tasks.length > 1 && (
                        <button
                          onClick={() => removeTask(task.localId)}
                          className="text-rose-300 hover:text-rose-200"
                          type="button"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-wide text-zinc-400">Name</span>
                      <input
                        type="text"
                        value={task.name}
                        onChange={(e) => updateTask(task.localId, { name: e.target.value })}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-wide text-zinc-400">Action type</span>
                      <select
                        value={task.action_type}
                        onChange={(e) => updateTask(task.localId, { action_type: e.target.value })}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="powershell_inline">powershell_inline</option>
                        <option value="bash_inline">bash_inline</option>
                      </select>
                    </label>
                  </div>

                  <label className="mt-3 block space-y-1">
                    <span className="text-xs uppercase tracking-wide text-zinc-400">Script</span>
                    <select
                      value={task.script_id ?? ''}
                      onChange={(e) =>
                        updateTask(task.localId, {
                          script_id: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                      disabled={loadingScripts}
                    >
                      <option value="">Select script</option>
                      {scripts.map((script) => (
                        <option key={script.id} value={script.id}>
                          {script.name} {script.target_os_type ? `(${script.target_os_type})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-zinc-500">
                      Scripts are pulled from the library. Create one first if you don't see it listed.
                    </p>
                  </label>

                  <label className="mt-3 block space-y-1">
                    <span className="text-xs uppercase tracking-wide text-zinc-400">Description</span>
                    <textarea
                      value={task.description ?? ''}
                      onChange={(e) => updateTask(task.localId, { description: e.target.value })}
                      className="min-h-[70px] w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                  </label>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={task.continue_on_error ?? true}
                        onChange={(e) => updateTask(task.localId, { continue_on_error: e.target.checked })}
                        className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                      />
                      <span>Continue on error</span>
                    </label>
                    <span className="text-zinc-500">Order: {idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
