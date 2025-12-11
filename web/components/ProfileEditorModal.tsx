'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  createProfile,
  createProfileTask,
  fetchScripts,
  updateProfile,
  updateTemplate,
  DeploymentProfileCreateInput,
  DeploymentProfile,
  DeploymentProfileWithTasks,
  DeploymentProfileUpdateInput,
  ProfileTaskCreateInput,
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
  onClose: () => void
  onCreated?: (profileId: number) => void
  onSaved?: (profile: DeploymentProfile) => void
}

interface TaskInput extends ProfileTaskCreateInput {
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

export function ProfileEditorModal({
  open,
  onClose,
  onCreated,
  onSaved,
  mode = 'profile',
  variant = 'create',
  initialProfile,
}: ProfileEditorModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetOsType, setTargetOsType] = useState<TargetOsType | ''>('')
  const [isTemplate, setIsTemplate] = useState<boolean>(mode === 'template')
  const [tasks, setTasks] = useState<TaskInput[]>([defaultTask(0)])

  const [scripts, setScripts] = useState<Script[]>([])
  const [loadingScripts, setLoadingScripts] = useState(false)
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

    const loadScripts = async () => {
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
    }

    setError(null)

    if (initialProfile) {
      setName(initialProfile.name)
      setDescription(initialProfile.description ?? '')
      setTargetOsType(initialProfile.target_os_type ?? '')
      setIsTemplate(initialProfile.is_template)
    } else {
      // reset form when opening
      setName('')
      setDescription('')
      setTargetOsType('')
      setIsTemplate(mode === 'template')
      setTasks([defaultTask(0)])
    }

    if (variant === 'create') {
      setTasks([defaultTask(0)])
      loadScripts()
    }
  }, [initialProfile, mode, open, variant])

  const updateTask = (localId: string, updates: Partial<TaskInput>) => {
    setTasks((prev) => prev.map((task) => (task.localId === localId ? { ...task, ...updates } : task)))
  }

  const addTask = () => {
    setTasks((prev) => [...prev, defaultTask(prev.length)])
  }

  const removeTask = (localId: string) => {
    setTasks((prev) => (prev.length === 1 ? prev : prev.filter((task) => task.localId !== localId)))
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
        const updatePayload: DeploymentProfileUpdateInput = basePayload
        const updater = mode === 'template' || initialProfile.is_template ? updateTemplate : updateProfile
        const updated = await updater(initialProfile.id, updatePayload)
        onSaved?.(updated)
        onClose()
        return
      }

      const profile = await createProfile(basePayload as DeploymentProfileCreateInput)

      // Create tasks sequentially to preserve ordering
      for (const [index, task] of tasks.entries()) {
        const payload: ProfileTaskCreateInput = {
          name: task.name?.trim() || `Task ${index + 1}`,
          description: task.description?.trim() || undefined,
          order_index: task.order_index ?? index,
          action_type: task.action_type || 'powershell_inline',
          script_id: task.script_id ?? undefined,
          continue_on_error: task.continue_on_error ?? true,
        }
        await createProfileTask(profile.id, payload)
      }

      onCreated?.(profile.id)
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

          {variant === 'create' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Tasks</p>
                  <p className="text-xs text-zinc-400">Configure ordered tasks that will be queued as device actions.</p>
                </div>
                <button
                  onClick={addTask}
                  className="rounded-md border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-800"
                >
                  Add task
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div key={task.localId} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Task {idx + 1}</span>
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
                      <label className="flex items-center gap-2">
                        <span className="text-zinc-400">Order</span>
                        <input
                          type="number"
                          value={task.order_index ?? idx}
                          onChange={(e) => updateTask(task.localId, { order_index: Number(e.target.value) })}
                          className="w-20 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
              Task editing is not available here yet. Update name, description, and target OS, or recreate the profile to change tasks.
            </div>
          )}

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
