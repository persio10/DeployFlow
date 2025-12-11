# DeployFlow Fleet – Architecture

DeployFlow Fleet combines a FastAPI backend, a dark-mode-first Next.js admin UI, and a C# Windows agent, tied together with a PXE/WinPE deployment flow. The goal is to deliver a cohesive deployment and device management experience that is simple to operate while remaining extensible for MSPs and internal IT teams.

## Components
- **Backend API (FastAPI)**: Owns core data models, business logic, and REST APIs that serve the web UI, agent, and PXE boot environment. Handles authentication, configuration storage, and action orchestration.
- **Web UI (Next.js)**: Dark-mode-first admin console for creating and managing deployment profiles/templates, viewing devices, queuing actions, and maintaining scripts, software items, and settings.
- **Agent (C#)**: Windows service that enrolls with the backend, sends heartbeats and basic inventory, and executes assigned actions (scripts and software installs) from the backend.
- **PXE / Deployment Flow**: iPXE/WinPE environment that contacts the backend to retrieve deployment profiles and task sequences, executes disk preparation and OS imaging, injects configuration and agent bootstrap, then reboots into the managed OS.

## Data Model
### OSImage
- id
- name
- version
- download_url / storage_ref
- description
- checksum

### DeploymentProfile
- id
- name
- description
- tags
- os_image_id
- computer_naming_pattern
- admin_credentials_ref
- agent_auto_install (flag)

### ProfileTask
- id
- profile_id
- order
- type (disk prep, apply image, script, software bundle, reboot, etc.)
- configuration (task-specific settings such as disk layout preset, image reference, script body, software bundle reference)

### Script
- id
- name
- description
- body
- tags

### SoftwareItem
- id
- name
- description
- install_command
- tags

### Device
- id
- hostname
- profile_id / template_id
- status (online/offline)
- os_version
- hardware_summary (cpu/ram/disk)
- last_check_in
- created_at

### Action
- id
- device_id
- type (run script, install software, etc.)
- payload (script reference/body, software reference)
- status (pending, running, succeeded, failed)
- logs (short execution output)
- created_at
- completed_at

### EnrollmentToken
- id
- name
- token_value
- description
- created_at
- expires_at (optional)
- allowed_profiles / scopes

## Key Flows
### PXE Deployment Flow
- Bare-metal machine PXE boots into iPXE/WinPE environment.
- Technician selects a deployment profile or template from the menu.
- Boot environment calls the backend to fetch the selected profile and ordered tasks.
- Execute tasks: disk preparation → OS image apply → inject configuration and agent bootstrap → reboot into Windows.

### Agent Registration & Heartbeat
- Agent starts and reads configuration/enrollment token.
- Agent registers with the backend using the enrollment token.
- Backend creates or updates the Device record.
- Agent sends periodic heartbeats with status and basic inventory.

### Remote Actions
- Admin queues actions (run script, install software) from the web UI.
- Backend records actions as Action entries tied to devices.
- Agent polls for pending actions, executes them, and reports results with logs and status updates.

## Tech Stack
- **Backend**: Python, FastAPI, SQLAlchemy, Postgres/SQLite for persistence.
- **Web**: Next.js (App Router), TypeScript, Tailwind CSS, dark-mode-first UI.
- **Agent**: C# .NET Worker Service (Windows service orientation).

## Future Extensions
- Multi-tenant MSP mode and advanced role-based access.
- Cross-platform agents (Linux, macOS).
- Metrics and monitoring for devices and actions.
- Scheduled tasks and policy enforcement.
- Integrations with PSA/RMM tools, Intune, SCCM, and other ecosystem systems.
