# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.39.0] - 2026-02-27

### Added
- **Native Mock System**: Replaced flat mockups with real, anonymized Kubernetes resource structures (API List format).
- **Unified Logging API**: New backend logic to fetch logs from any workload (Deployment, Job, CronJob) by automatically resolving them to their associated pods.
- **Resource Templates**: New modular frontend architecture with dedicated templates for all major K8s resources (Pods, Deployments, Nodes, etc.), restoring the detailed views from v0.37.0.
- **CRD View**: Dedicated detailed view for CustomResourceDefinitions with version and scope information.

### Fixed
- **Stability**: Fixed multiple "white screen" crashes by implementing optional chaining and safer data mapping.
- **Secret Management**: Improved Base64 handling with UTF-8 support and secure masking/editing.
- **Node View**: Restored rich node metrics, allocation pie charts, and system information.
- **YAML View**: Fixed manifest loading for cluster-scoped resources and added JSON format support.

## [0.38.0] - 2026-02-26

### Fixed
- **RBAC Duplication**: Implemented backend deduplication logic to ensure users are not duplicated in the "Global Assignments" table when they appear in both static config and live cluster bindings.
- **API Groups Formatting**: Fixed a UI issue where the API Groups list had a leading comma; empty groups (core) are now clearly displayed as `(core)`.

## [0.27.2] - 2026-02-23

### Added
- **Live RBAC Assignments**: The Admin Panel now dynamically fetches and displays `ClusterRoleBinding` and `RoleBinding` objects from the cluster (filtered by `kview-` prefix).
- **K-View Role Definitions**: Added a "Role Definitions" section to the Admin Panel to display the actual Kubernetes `ClusterRole` details (API Groups, Resources, Verbs) labeled with `k-view`.

### Fixed
- **Settings Input Focus**: Resolved a critical UI bug where the settings input fields would lose focus after every character change.
- **Admin Panel Build**: Fixed a production build error caused by an incorrect import path for `SettingsContext`.

### Refactored
- **Internationalization**: Completed the transition to the `useTranslation` hook across all Admin Panel components.

## [0.27.0] - 2026-02-22

### Added
- **Internationalized Resource Kinds**: Resource kind names (e.g., "Pod", "Deployment") are now translated into the user's selected language.
- **Replication Controller Support**: Full lifecycle support for Replication Controllers, including listing, details, and scaling actions.
- **New Resource Labels**: Added more descriptive column labels in resource tables for better clarity.

## [0.26.0] - 2026-02-22

### Refactored
- **Transition to useTranslation**: Centrally initialized the `useTranslation` hook in the main `App` component to unify localization logic across the frontend.

## [0.25.0] - 2026-02-22

### Added
- **Multi-language Support (i18n)**: Implemented the foundational internationalization system with initial English and Polish translations.

## [0.24.0] - 2026-02-21

### Changed
- **Development Mock Data**: Updated backend mock resources to include more realistic edge cases and data structures for offline testing.

## [0.22.0] - 2026-02-21

### Added
- **Real-time Event Logging**: Resource details view now includes a "Recent Events" section fetching live Kubernetes events associated with the specific object.

## [0.21.0] - 2026-02-21

### Added
- **Enhanced Navigation**: Implemented a collapsible sidebar to maximize screen real estate for resource management tasks.

## [0.20.0] - 2026-02-21

### Added
- **Network Flow Trace**: Added a dedicated "Network Trace" tab in resource details for visual traffic analysis.
- **Dynamic Terminal Themes**: The `PodTerminal` now automatically switches colors based on the application's light/dark theme.

## [0.19.0] - 2026-02-21

### Refactored
- **Unified Terminal System**: Renamed `TerminalModal` to `PodTerminal` and standardized its integration across various resource views.

## [0.18.2] - 2026-02-21

### Changed
- **RBAC Visualization**: Improved the rendering of RBAC assignments in the backend ConfigMap to handle complex subject types more gracefully.

## [0.18.1] - 2026-02-21

### Fixed
- **Namespace Fetching**: Optimized the backend to handle direct array responses from Kubernetes when fetching available namespaces.

## [0.17.0] - 2026-02-21

### Added
- **SSO Toggle Configuration**: Introduced the `KVIEW_ENABLE_SSO` environment variable to allow quick enabling/disabling of Google SSO via Helm/deployment config.

## [0.16.0] - 2026-02-21

### Added
- **Google SSO Whitelisting**: Added the `KVIEW_AUTHORIZED_USERS` environment variable to restrict Google SSO login to specific email addresses.
- **Graceful SSO Error UI**: Redirects unauthorized SSO attempts to the standard login page with a user-friendly error banner.
- **Collapsible Local Auth**: The local `Username/Password` login form is now hidden behind a toggle button when SSO is enabled.

### Fixed
- **Console RBAC Impersonation**: Fixed a security issue in the in-app terminal; it now correctly injects `--as=<email>` to impersonate the logged-in user natively.

## [0.15.0] - 2026-02-21

### Added
- **Unified Action Menu**: Consolidated edit, delete, export, logs, and exec actions into a single vertical menu.
- **Improved Force Delete**: Robust handling for stuck resources with immediate finalizer removal options.

## [0.14.0] - 2026-02-21

### Added
- **Workload Management**: Dedicated actions for Scale (Deployments), Restart (Pods), and Force Delete across all workloads.

## [0.13.0] - 2026-02-21

### Added
- **Namespace Insights**: Display of Resource Quotas and Limit Ranges within the namespace details view.
- **Visual Trace Improvements**: Enhanced Ingress network flow visualization with rich HTML labels.

## [0.12.0] - 2026-02-21

### Added
- **Mermaid Graph Enhancements**: Switched to flowchart-style diagrams for network traces with sanitized edge labels.
- **Custom Favicon**: Project brand identity integration.

## [0.11.0] - 2026-02-21

### Added
- **User Permission Details**: Detailed breakdown of effective RBAC permissions for the logged-in user in the Admin Panel.

## [0.10.0] - 2026-02-21

### Added
- **Ingress & Storage Exploration**: Added listing and details support for Ingress Classes, Storage Classes, and Cluster Roles.

## [0.9.0] - 2026-02-21

### Added
- **Resource Reordering**: Optimized sidebar navigation with logical grouping of cluster-scoped vs namespace-scoped resources.

## [0.8.0] - 2026-02-21

### Added
- **Legacy Workload Support**: Added visibility for ReplicaSets and Replication Controllers with status indicators.

## v0.1.0 - v0.7.0 (Development Phase)

### v0.7.0
- **Kubernetes Events**: Integrated live cluster event stream into the dashboard.

### v0.6.0
- **Metrics Integration**: Added Pod CPU and RAM usage charts using the Kubernetes metrics-server.

### v0.5.0
- **Live Logs**: Real-time streaming of pod logs with ANSI terminal color support.

### v0.4.0
- **Live YAML/JSON Editor**: Direct manifest editing within the browser with full schema validation.

### v0.2.0
- **Declarative Core**: Moved from local database storage to a fully stateless, declarative configuration model.

### v0.1.0
- **Initial Release**: Basic resource viewer, Google SSO integration, and glassmorphism UI.