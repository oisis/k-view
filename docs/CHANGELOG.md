# Changelog

All notable changes to this project will be documented in this file.

## [0.14.0] - 2026-02-21
### Added
- **Resource Actions**: Restart (Pods/Workloads), Scale (Deployments/Sets), and Force Delete support.
- **Resource Action Menu**: Unified vertical menu for edit, delete, export, logs, and exec.
- **Improved README**: Added a visual demo recording and link-to-zoom.

### Changed
- Refined UI spacing and padding for a more compact and modern look.
- Improved logout button visibility and placement.

## [0.13.0]
### Added
- **Namespace Insights**: Display of Resource Quotas and Limit Ranges in namespace details.
- **Visual Trace**: Network Flow Trace visualization for Ingresses.

### Fixed
- RBAC permissions for cluster-admins to allow full resource management.
- Terminal modal z-index issue where it was being overlayed by the sidebar.

## [0.12.0]
### Added
- Custom favicon support.
- Enhanced Mermaid diagrams with rich HTML labels and message styling.

## Early Versions (0.1.0 - 0.11.0)
- **Core Features**: Kubernetes node/pod/workload listing, web-based terminal, live logs, Google SSO (OIDC) integration, static RBAC.
- **Tooling**: GitHub Actions CI/CD for Docker and Helm, multi-arch builds.
- **UI**: Modern dark theme with glassmorphism, interactive console for `kubectl` commands.