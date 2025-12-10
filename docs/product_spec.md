# DeployFlow Fleet – Product Specification

DeployFlow Fleet is a modern deployment and management platform tailored for small and mid-sized MSPs and internal IT teams. It enables PXE-based provisioning of bare-metal Windows devices into standardized OS images, using powerful task-sequence-style profiles to keep builds consistent. Once deployed, devices auto-enroll into a lightweight fleet agent for ongoing scripts, software deployment, and basic inventory collection. The web UI is clean, human-readable, and dark-mode-first to make routine fleet work fast and pleasant.

## Elevator Pitch
DeployFlow Fleet lets IT teams PXE-boot machines into opinionated deployment profiles and keep them managed with a lightweight Windows agent—all from a clean, dark-mode UI that favors human-readable workflows over complexity.

## Target Users & Use Cases
### Target Users
- MSP engineers responsible for many customer environments.
- Internal IT leads managing corporate fleets.
- Helpdesk technicians performing day-to-day deployments and fixes.

### Primary Use Cases
- Standard PC deployments.
- Server baseline deployments.
- Post-deployment configuration via scripts and software packages.
- Ongoing fleet visibility and remote actions.

## Month 1 Scope – Features
### Must-Have Features (Month 1)
#### Deployment Profiles (Task-Sequence Style)
- Profiles are ordered sequences of tasks such as disk preparation, OS image apply, first-boot configuration, software bundle install, PowerShell scripts, and reboots.
- Each task type has its own configuration (e.g., disk layout preset, OS image selection, script body, software bundle reference).
- Profiles include meta fields: name, description, tags, OS image reference, computer naming pattern, admin credentials, and agent auto-install flag.

#### Templates System
- Templates area in the UI with built-in deployment templates provided by DeployFlow Fleet (e.g., “Standard Windows 11 Office PC”).
- Users can deploy directly from a template or clone a template to create a customizable deployment profile.
- Templates share the same structure as profiles but are treated as reusable blueprints.

#### PXE Boot & Deployment Flow
- DeployFlow server exposes PXE/iPXE boot options.
- Bare-metal machines PXE boot into a simple menu where technicians select a profile or template.
- The selected task sequence runs end to end: disk preparation → OS apply → inject configuration and agent bootstrap → reboot.

#### Lightweight Fleet Agent (Windows)
- Windows service that registers with the server using an enrollment token/configuration.
- Sends basic inventory (hostname, OS, CPU/RAM/disk) and periodic heartbeats.
- Polls for pending actions and executes PowerShell scripts and software install commands (WinGet/Chocolatey/MSI/EXE), returning exit codes and small logs for each action.

#### Fleet UI (Devices Page)
- Table view of all enrolled devices, with columns such as name, OS, last check-in, status (online/offline), and associated profile/template.
- Filter/search by name, profile/template, status, and tag.
- Device detail view with hardware summary, action history, tags, and notes.

#### Remote Actions & Action Queue
- From device pages or multi-select lists, users can run scripts (from library or inline) and install software (from library).
- Action queue tracks tasks per device as Pending, Running, Succeeded, Failed, and stores short logs.
- Action history is visible per device for auditability.

#### Script & Software Library
- Library of reusable scripts with name, description, and PowerShell body.
- Library of reusable software items with name, description, and install command.
- Profiles and remote actions can reference these items for repeatability.

#### Authentication & Basic Settings
- Admin login to the web UI.
- Basic settings page for server URL, enrollment tokens, and default deployment options.

#### Dark Mode UI
- Web UI ships with first-class dark mode by default (dark-first design).
- Simple, minimal, human-readable styling with a future light mode toggle via theming.

### Out-of-Scope for Month 1 (Later Features)
- Multi-tenant MSP mode and role-based access.
- Cross-platform agents (Linux/macOS).
- System metrics/monitoring and alerting.
- Scheduled recurring tasks/policies.
- Rich reports and dashboards.
- Deep integrations (PSA/RMM, Intune/SCCM, etc.).
- Advanced driver management and model-specific tweaks.
- Cloud-hosted/SaaS offering.

## User Stories
### Deployment
- As an MSP engineer, I want to define deployment profiles as sequences of tasks so I can flexibly control how PCs and servers are built.
- As a helpdesk tech, I want to PXE boot a new machine and simply pick a profile/template so I can start a full deployment without building media or remembering every step.

### Templates
- As an IT lead, I want built-in templates I can clone so I can get started quickly and then customize for my environment.
- As a tech, I want to create my own templates for common hardware types or roles so deployments are consistent and repeatable.

### Fleet Management
- As an IT lead, I want to see all enrolled devices with online/offline status and last check-in so I know what is reachable.
- As a tech, I want to see the deployment profile used on each device so I know how it was originally built.

### Scripts & Software
- As a tech, I want a library of common scripts so I don’t have to re-type them for each device.
- As an MSP engineer, I want to define software entries with install commands so I can reuse them in deployments and post-deploy actions.

### Reliability & Safety
- As an IT lead, I want logs for each action so I can confirm what changes were applied and when.
- As a security-conscious admin, I want the agent to use outbound HTTPS polling so no inbound firewall holes are required.

## Non-Functional Requirements
- **UX & Simplicity:** Clean, modern, dark-mode-first UI with minimal clutter, descriptive labels, and clear error messages. Human-readable configuration for task names, templates, and profiles.
- **Security:** All client-server communication over HTTPS. Token-based enrollment for agents. Basic authentication for the admin UI with room for stronger auth later.
- **Reliability:** Agent handles transient errors with retries. Server stores action logs and statuses durably.
- **Extensibility:** Backend and data model leave room for future features like multi-tenancy, scheduling, and additional OS support.

## Tech Stack (Initial Plan)
- **Backend:** Python + FastAPI + Postgres (or SQLite in development).
- **Frontend:** Next.js (React) + TypeScript + Tailwind CSS, dark-mode-first.
- **Agent:** C# (.NET, Windows service) for the Windows v1 agent.
- *Note:* This is the initial architecture plan and may be elaborated in a separate architecture document.
