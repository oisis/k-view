# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.48.0] - 2026-03-13

### Added
- **UI Modernization**: Switched to Shadcn/ui and Tailwind CSS for a more robust and professional interface.
- **Animations**: Integrated Framer Motion for smooth transitions, staggered list loading, and interactive UI elements.
- **Interactive Network Flow**: Replaced Mermaid.js with React Flow for the Network Trace view, enabling draggable nodes and animated traffic flows.
- **Theming System**: Added a new "Soft Azure" light theme and a dedicated "Blue" K-View theme alongside the standard Zinc-based dark mode.

### Fixed
- **Contrast & Readability**: Conducted a project-wide audit to eliminate white-on-white and dark-on-dark text issues, especially in tables, logs, and modals.
- **Table Grid Lines**: Standardized and strengthened vertical and horizontal lines across all resource views for better data structure visualization.
- **Scroll Issues**: Fixed layout constraints that prevented vertical scrolling on long resource lists and detail pages.

## [0.47.0] - 2026-03-05

### Added
- **YAML Support for Creation**: Enabled native YAML/JSON parsing in the resource creation API to support standard manifest formats.
- **Resource Management**: Added dedicated backend managers for `ResourceQuota` and `LimitRange` to expose technical details via DTO.
- **ServiceAccount Connectivity**: Implemented backend logic to fetch and display both `secrets` and `imagePullSecrets`.

### Fixed
- **RBAC Visibility**: Corrected resource detection and routing in `OverviewTab` for `Role`, `ClusterRole`, `RoleBinding`, and `ClusterRoleBinding`, ensuring rules and references are displayed.
- **PV Details**: Fixed `claimRef` mapping and improved `ExpandableCell` to correctly handle array-based data like `mountOptions`.
- **Node Allocation**: Fixed calculation of CPU/RAM limits for all pods on a node to provide accurate pie chart data.
- **ConfigMap/Secret Editing**: Improved textarea styling with transparent backgrounds and red borders while disabling word wrapping in edit mode.

### Changed
- **Node UI**: Redesigned the "System Information" section as a vertical header table and "Allocation" as high-visibility pie charts.
- **CRD View**: Converted "Accepted Names" from grid tiles to a standardized table format for better data density.
- **PV View**: Standardized "Source" and "Resource Info" tables with fixed layouts and comprehensive column mappings.

## [0.46.0] - 2026-03-02

### Added
- **Automated Testing Suite**: Implemented "Frozen Views" verification using Vitest and React Testing Library to ensure UI stability.
- **Unified Test Data**: Created a comprehensive set of 27 interconnected resource manifests in `/examples/test-suite`.
- **Scripts Directory**: Consolidated all automation (build, test, deploy) into a dedicated `/scripts` directory with dynamic path resolution.
- **Local Deployment Script**: Added `local-deploy.sh` with automatic versioning, port-forwarding, and cleanup.
- **Metrics Automation**: Added `metrics-server.sh` for easy installation of the Metrics Server on local clusters.

### Changed & Refactored
- **Native Kubernetes Integration**: Completely removed `MockClient` and all static JSON mock data. The application now relies exclusively on the native Kubernetes API.
- **Navigation**: Migrated `Sidebar` to use React Router `Link` components for smoother, reload-free navigation.
- **Project Structure**: Removed obsolete `docker-compose.yaml` and legacy RBAC configuration files.
- **Dockerfile**: Optimized final image by removing mock data copying and refining build arguments.

### Fixed
- **CRD Highlighting**: Fixed sidebar active state when viewing Custom Resource Definitions.
- **Test Integrity**: Fixed backend utility tests and unified ResourceItem typing across all handlers.

## [0.45.1] - 2026-03-02

### Fixed
- **Logs**: Fixed broken Logs tab by correctly passing resource kind, name, and containers props to the Log component.
- **I18n**: Corrected translation key for search results in the Logs viewer.

## [0.45.0] - 2026-03-02

- feat: expand ServiceAccount support, add UID to headers, and fix UI stability issues
- style: simplify Role Bindings list columns and add metadata documentation
- feat: rename Network to Service and expand Persistent Volume detailed view
- feat: modernize Node detailed view with PodCIDR, Taints and larger allocation charts
- style: unify special resource metadata layout to a consistent 4-column grid
- feat: modernize Events view with 9 columns, improved pagination and full localization
- feat: complete CRD lifecycle support with dynamic object listing and optimized RBAC views
- feat: expand StorageClass detailed view with parameters and related PVs table
- feat: enhance networking resource views with related ingresses, session affinity and optimized metadata
- feat: modernize StatefulSet detailed view and enhance PodsTable with more columns
- feat: implement Replication Controller detailed view and real-time pod metrics
- fix: repair namespace selector portal and improve its UI and positioning
- feat: optimize ReplicaSet detailed view and fix broken resource navigation links
- feat: unify resource naming and colors across dashboard with theme-aware CSS variables
- fix: remove \"No specialized overview\" message from HPA detailed view
- feat: implement full support for Horizontal Pod Autoscalers (HPA)
- feat: improve sidebar navigation highlighting for resource detail views
- feat: optimize Deployment metadata and split ReplicaSets into New and Old sections
- feat: implement cache busting via Cache-Control headers and frontend version check
- feat: add related services table to DaemonSet detailed view and unify table styles
- feat: enhance CronJob detailed view with active/inactive job tables and metadata optimization
- feat: implement real-time cluster metrics and resource usage in dashboard
- Remove tmp file
- Remove tmp binary file
- feat: add specialized Job overview with container details and pods list
- fix: change REPLICA_SET header to Replica Set and update translations
- fix: complete DaemonSet detailed view and resolve UI rendering errors
- refactor: modularize backend handlers, add unit tests and fix CronJob container view


## [0.44.0] - 2026-03-01

- style: fix RBAC binding colors and header styling
- fix: enable PV overview and format capacity units
- style: format Persistent Volumes columns and update localization
- feat: implement real Node allocation stats and optimize Pods table layout
- style: enhance NetworkPolicy UI and improve resource detection logic
- fix: implement deep fetching for quotas/limits and fix namespace status display
- fix: restore and correctly populate Namespace status in details view
- fix: implement CRD mapping and refine list column widths
- style: add colored backgrounds to RBAC rules and fix YAML formatting
- fix: support properly formatted YAML and stabilize cluster resource views
- fix: stabilize backend handlers and harden UI for cluster-scoped resources
- fix: improve secret data display with line preservation and fix overview tab routing
- fix: add Secret mapping in backend to populate Type and Labels columns
- fix: correct URL parameter handling and pass translation function to EventsTab
- style: format Service list columns and add missing translations for all locales
- style: remove redundant Resource Info from Ingress view and fix backend mapping
- feat: add specialized IngressClass overview and fix UI styling
- fix: populate Images and Labels for all workload types in backend mapping
- style: set equal widths for Labels and Annotations columns in resource list


## [0.43.0] - 2026-03-01

- style: format resource list headers by adding proper translations for cluster and config resources
- style: remove Namespace column from cluster-scoped resources and fix YAML update handler
- style: redesign action menu with glassmorphism and corrected text colors
- style: optimize CronJob list layout and apply tighter font for Schedule values
- style: improve CronJob overview layout and standardize Last Run column translations
- style: enforce opaque table headers and uniform borders for perfect cross-view consistency
- fix: remove CSS background block and force blue headers with inline styles
- fix: correct translation keys and labels to ensure proper CPU/RAM usage display
- feat: add local-dev-deploy script and enable metadata horizontal scrolling
- Fix font size


## [0.42.0] - 2026-02-28

- fix(details): implement deep data extraction for Status and Owners
- feat(backend): fetch and include pod metrics in resource details API
- feat(trace): implement full network path tracing including Ingress and Internet source
- fix(trace): refactor network flow diagram with systemic theming and interactive tooltips
- assets: add official Kubernetes resource icons
- feat(web): add syntax highlighting and JSON prettifying in manifest viewer
- ui: unify active state styling and fix light theme text colors\n\n- Standardized active buttons/toggles to use a solid blue background with white text across all components.\n- Fixed text-white variable in Light theme to be actual white for better contrast on blue backgrounds.\n- Updated YAML/JSON switcher and log viewer controls with the unified active style.\n- Refined sidebar and dropdown selection highlights.
- ui: hide Events tab for passive/static resources


## [0.41.0] - 2026-02-27

- style(ui): standardize and unify typography across the application\n\n- Increased base font size for text-xs from 10px to 12px for better readability.\n- Migrated all hardcoded pixel-based font sizes (10px, 11px, 13px) to semantic Tailwind classes (text-xs, text-sm).\n- Unified label styling across all components (Metadata, Tables, Settings) to use consistent bold weights and tracking.\n- Synchronized table header font sizes across all general and admin views.\n- Restored missing translations for various resource sections in Polish and English.
- ui: change console welcome banner color to theme primary text
- ui: redesign theme selection tiles and refine settings header\n\n- Improved theme tiles with larger icons (36px) and side-by-side labels.\n- Added transparency and backdrop blur to theme tiles for better Glassmorphism.\n- Removed unnecessary bottom border from the Settings page header.
- ui: optimize editor and log viewer font sizes and line height\n\n- Updated default font size to 13px for YAML and Logs tabs\n- Reduced line height in CodeEditor to 1.25rem for a more compact view\n- Added 13px option to the log viewer font size selector
- style(ui): brighten secondary and muted text colors for Dark and K-View themes\n\n- Updated RGB channels for secondary and muted text variables in .theme-dark and :root.\n- Increased brightness to Slate-300/400 for K-View and Zinc-300/400 for Dark mode to improve legibility on dark backgrounds.
- ui: remove footer border from Dashboard for cleaner look
- fix(ui): collapse all sidebar sections by default and stabilize storage keys\n\n- Updated Section component to use a stable id prop for localStorage persistence\n- Changed defaultOpen to false for all sidebar sections to ensure a clean initial UI state\n- Decoupled section expansion state from localized labels


## [0.40.0] - 2026-02-27

- [build] feat: bump application version to 0.40.0 and sync Helm charts
- style(ui): finalize deep blue header styling across all themes\n\n- Unified DetailSection headers with a deep blue background (#1e3a8a) and white text.\n- Applied this style across all themes (Light, Dark, K-View) for consistent section separation.
- style: invert headers in light theme and update translations
- style(ui): unify border styling across all themes\n\n- Standardized table and container borders to 1.5px thickness for all themes.\n- Enforced global border-collapse: collapse for all tables to prevent double lines.\n- Set border colors to solid blue for Light theme and semi-transparent white for Dark/K-View themes.\n- Applied consistent internal cell and divider borders globally.
- style(ui): unify table borders and enhance Light theme visibility\n\n- Replaced hardcoded slate-600 borders with theme-aware borders in all components\n- Enforced border-collapse: collapse globally to prevent double lines\n- Increased border opacity and thickness in Light theme for better clarity\n- Added missing large font sizes (3xl-5xl) to Tailwind config and CSS
- style(ui): transform Dark theme from slate-blue to neutral black/gray palette\n\n- Redefined .theme-dark variables to use a true black and neutral gray palette.\n- Added grayscale filter and adjusted opacity/brightness for the wallpaper in Dark mode.
- ui: fix theme selection tile styling and resolve heading color conflict\n\n- Decoupled theme selection tiles in Settings.jsx from the active system theme by using raw HEX values for consistent previews.\n- Removed the !important flag from global heading styles in index.css to allow local utility overrides (fixing gray text on white tiles).\n- Ensured consistent icon backgrounds and text colors for all theme preview states.
- ui: standardize Dashboard layout and typography\n\n- Standardized Dashboard header and metric font sizes to match other pages\n- Added missing large font size variables (3xl-5xl) to CSS and Tailwind config\n- Adjusted padding and margins for better UI consistency
- fix(i18n): complete and synchronize all translations across 8 languages\n\n- Fixed missing translations in Polish (Reload, Default Namespace, etc.)\n- Synchronized all locale files (DE, FR, ES, JA, KO, ZH) to match the English master key set\n- Verified syntax and structure for all supported languages
- style(ui): implement unified transparency system across all themes\n\n- Standardized default opacity levels for cards, glass elements, sidebars, and overlays\n- Refactored tailwind.config.js to support automatic default opacities via functional color values\n- Aligned CSS variable mappings in index.css with the new unified transparency standards
- refactor(ui): execute deep system refactor for consistency and tab sync\n\n- Migrated 700+ arbitrary CSS variable usages to semantic Tailwind classes\n- Added storage event listeners to Settings and Theme contexts for cross-tab synchronization\n- Replaced hardcoded HEX colors in Dashboard charts with theme-aware variables\n- Finalized RGB channel system in index.css for full opacity modifier support\n- Improved heading visibility and layering across all pages
- fix(ui): resolve layering issues and restore background transparency\n\n- Fixed Z-index in App.jsx to ensure content is above the wallpaper\n- Removed blocking bg-main backgrounds from Settings and About pages\n- Updated index.css with global wallpaper variables across all themes\n- Improved heading visibility with high-specificity color rules
- fix(i18n): restore full multi-language support and fix translation syntax errors\n\n- Restored translation files for DE, ES, FR, JA, KO, ZH\n- Updated EN and PL with new settings-related keys\n- Fixed JS syntax errors in French locale preventing production builds
- fix(ui): disable DaisyUI to resolve table background conflicts\n\nDisables the DaisyUI plugin in tailwind.config.js to prevent it from injecting default table styles that cause unwanted gradients and background layering in the Glassmorphism-based UI.
- style(ui): unify table backgrounds across the application
- refactor(ui): Remove borders from labels and badges
- feat(ui): Add theme-aware background overlay
- feat(ui): Refactor theme system and normalize styles


## [0.39.0] - 2026-02-27

- fix(backend): ensure all relevant fields are returned in GetDetails and GetYAML for Nodes and ConfigMaps
- feat(web/backend): unify logging API and improve workload detail views with better data mapping
- Update gitignore
- fix(backend/web): restore missing detail view tables (RBAC, owners, pods) and fix pod filtering logic
- fix(backend/web): fix ServiceAccount detail view by fixing loop variable bug and including secrets in API response
- fix(backend/web): improve Node detail views with rich mock data and fix YAML manifest loading
- fix(web): remove redundant Resource Info table from Network Policy detail view
- fix(web): prevent crash in Namespace view by correctly passing icons to quotas and limits tables
- Fix domain names
- feat(web): add dedicated CRD overview template and update sidebar label to 'Custom Resources Def'
- fix(web): restore SecretDataSection and improve Base64 UTF-8 handling for secret viewing and editing
- fix(backend/web): restore ConfigMap data table view by including data field in API response
- fix(web): prevent crash in Ingress view and fix IngressRulesTable props mapping
- fix(web): fix ReferenceError for Link and add extensive safety checks in resource detail views
- fix(backend): handle DEV_MODE in GetEvents and fix resource kind filtering
- feat(backend): add comprehensive mock events data for all resources
- chore(backend): remove last-applied-configuration annotations from mocks
- refactor(web): restore detailed views for PV, NetworkPolicy and ServiceAccount with mounted resources logic
- feat(web/backend): add rich mocks, fix event details and add dedicated templates for DaemonSet and StatefulSet
- refactor(web): modularize resource lists and detail views using templates based on v0.37.0
- fix(backend): improve CronJob mapping and fix k8sutils images extraction
- refactor: replace flat mocks with native Kubernetes resource structures (redacted secrets)
- feat: add comprehensive anonymized mock data and detailed mock view logic [build]


## [0.38.0] - 2026-02-26

- refactor(web): implement useResourceData hook and simplify components
- refactor(web): modularize translations into separate locale files
- feat(backend): implement external JSON mock data loading
- refactor(backend): complete modularization of resource handlers
- refactor(backend): modularize network mapping logic
- refactor(backend): modularize resource actions and events
- refactor(backend): modularize workload mapping logic
- refactor(backend): split base handler types and common utils
- refactor(backend): move utilities and k8s helpers to pkg/
- Update gitignore
- Remove tmp file
- chore: sync web package version with helm chart 0.37.0
- add gemini files to ignore
- feat: add Pod-specific Resource Info table and update mockups
- Remove local doc
- feat: fix k8s resource mapping and simplify daemonset view
- Add geminiignore file
- Add Gemini exclude to gitignore
- feat: enhance search functionality across all resource listings
- feat: update expandable cell logic and mock data


## [0.37.0] - 2026-02-25

- [build] upgrade to v0.37.0: update pod details overview and version bump
- feat: add support for ServiceAccount details view with Secrets and ImagePullSecrets tables
- feat: add support for Role details view and update backend mock handlers
- feat: add support for RoleBinding details view in backend and frontend
- ui: update resource list columns and action menu for PersistentVolumes
- ui: add CapacityTable and SourceTable components for resource details
- ui: update resource list columns and overview tab details
- ui: add PieChart component and update resource details overview


## [0.36.0] - 2026-02-25

- [build] upgrade to v0.36.0: update node handlers and k8s client
- ui: add NetworkPolicy details view and update backend resource handlers
- ui: add ResourceQuotas and LimitRanges tables and update resource details components
- feat: add EventsList component and update backend handlers
- ui: add RulesTable and update resource overview, lists and action menu
- ui: update backend mocks and add SubjectsTable to overview
- ui: update ResourceActionMenu and ResourceList column schemas
- ui: modularize ResourceDetails and update StorageClass overview


## [0.35.0] - 2026-02-25

- [build] v0.35.0: major refactor of ResourceDetails into modular components
- ui: simplify Secret details view and add data preview/edit section
- ui: move Age field to first Metadata row for ConfigMaps and PVCs
- ui: simplify ConfigMap details view and fix backend data delivery
- ui: update column schemas and mock data for ConfigMaps, Secrets, PVCs, and StorageClasses


## [0.34.0] - 2026-02-25

- [build] v0.34.0: fix IngressClass details, update Service columns, and resolve compilation errors
- ui: update general lists and mockups for StatefulSets, ReplicaSets, and ReplicationControllers
- ui: refactor ContainerDetails to row-based layout and use ExpandableCell for images


## [0.33.0] - 2026-02-25

- [build] v0.33.0: Refactor Pod and Job detail views, update general lists, and enhance mock data
- ui: refactor Job details, remove Logs tab, and fix CronJob layout
- ui: change Job Succeeded label to Running and update mock data
- ui: refactor Job details view and general list columns


## [0.32.0] - 2026-02-25

- [build] v0.32.0: Deployment UI refactor and stability fixes
- ui: refactor Daemon Set details, remove Resource Info section, and add stability null-checks
- test: fix DaemonSet details mock to include correct status fields
- ui: remove Logs tab from Daemon Set details
- ui: move Daemon Set pod counts to Metadata and remove redundant Resource Info section
- test: update backend mockups to support new Daemon Set UI fields (pods linking, services details)
- fix: resolve duplication of component declarations causing build failure
- ui: update Daemon Set details with related Pods/Services tables and refined info bar
- ui: update Daemon Sets layout with interactive columns and enable logs access


## [0.31.0] - 2026-02-25

- ui: refine cron schedule appearance and finalize table interactivity with portals
- feat: add 'Run Now' action for CronJobs to trigger immediate execution
- ui: global refactor of tooltips/popovers using React Portals and tooltip theme variables
- ui: change dev login button to a darker orange/amber for better contrast
- ui: add --text-button theme variable and fix login button text contrast


## [0.30.7] - 2026-02-25

- ui: standardize table header fonts and unify ResourceList headers with ResourceDetails section headers


## [0.30.6] - 2026-02-25

- helm: set default revisionHistoryLimit to 2
- [build] ui: standardize font sizes, compact resource info, and refine details tab menu with centered layout and accent borders. Bump version to 0.30.6.


## [0.30.5] - 2026-02-25

- [build] helm: unify assignments to root level and fix variable scope in helper templates for reliable SSO whitelisting. Bump version to 0.30.5.


## [0.30.4] - 2026-02-24

- [build] helm: fix variable scope in helper templates using dict accumulator to ensure correct SSO whitelist generation. Bump version to 0.30.4.


## [0.30.3] - 2026-02-24

- [build] ui: fix context provider hierarchy, syntax errors, and missing imports in App.jsx. Bump version to 0.30.3.


## [0.30.2] - 2026-02-24

- [build] ui: isolate localStorage settings and sidebar state per user email to prevent cross-user data leakage. Bump version to 0.30.2.


## [0.30.1] - 2026-02-24

- [build] helm: fix rbac assignment list detection by switching to kindIs slice. Bump version to 0.30.1.




## [0.30.0] - 2026-02-24

- ui: change tables headers
- ui: fix contrast and visibility for toggles, search bars, and selects across themes
- ui: remove redundant Recent Events section from resource overview
- ci: prevent double builds by removing tag trigger from workflow


## [0.29.5] - 2026-02-24

- fix: ensure immediate and reliable namespace command prefixing in Console


## [0.29.4] - 2026-02-24

- ui: refine Cluster Info card typography for better hierarchy
- ui: widen Dashboard layout by removing max-width constraints
- feat: implement 5s auto-refresh for all resources and remove manual refresh buttons
- ui: remove redundant Add Resource button from resource lists
- ui: replace inline action confirmations with centered, themed modals and full localization


## [0.29.3] - 2026-02-24

- [build] fix: stabilize action menu for production, add missing translations, and bump chart version to 0.29.3
- fix: use React Portal for action menu to prevent clipping by table overflow


## [0.29.2] - 2026-02-24

- refactor: Rename themes
- feat(theming): Refactor theme loading to support direct selection


## [0.29.1] - 2026-02-24

- [build] feat: Add editor background color variable, refine dev mode messages and mock resource deletion, update chart versions, and enhance resource action menu options to include Jobs/CronJobs and improve styling. Version 0.29.1
- chore: Update favicon path in index.html.


## [0.29.0] - 2026-02-24

- [build] feat: Implement a new dynamic theming system with customizable templates and icons. Upgrade to 0.29.0
- feat: Enhance resource details with deployment strategy, replica set, pod restarts, service account, and updated cronjob data.


## [0.28.1] - 2026-02-24

- feat: Grant create permissions in RBAC roles, bump chart version to 0.28.1, and update error message styling to use CSS variables.


## [0.28.0] - 2026-02-24

- [build] feat: enable Kubernetes resource creation through a new UI modal and backend API. Version 0.28.0
- docs: Update changelog, add SSO configuration and RBAC admin panel details.


## [0.27.3] - 2026-02-23

- [build] fix: Deduplicate RBAC assignments, refine API group display for core groups, and update application version to 0.27.3.


## [0.27.2] - 2026-02-23

- [build] feat: Dynamically pobiera przypisania RBAC z API Kubernetes i aktualizuje interfejs użytkownika panelu administracyjnego.
- feat: Implement wyświetlanie definicji ról K-View w panelu administracyjnym wraz z nowym API backendu do ich pobierania.
- feat: Extend Kubernetes roles and ClusterRoles with additional API groups and resource types for broader resource management.
- [build] Add debug information to fix Replication Controllers issue
- feat: Implement success notification for resource YAML updates, enhance error handling, and add backend update logs.
- refactor: wyodrębniono komponenty InputField i SelectField z komponentu Settings.
- [skip ci] refactor: dostosuj strukturę eksportu komponentu Settings.


## [0.27.0] - 2026-02-23

- feat: Enhance resource details with i18n for singular kinds, add Replication Controller actions, introduce new resource table labels, and update chart version to 0.27.0.
- [skip ci] feat: Implement glassmorphism design system across the application, update login and theme selection UI, and introduce pagination state.


## [0.26.0] - 2026-02-23

- Initialize the `useTranslation` hook in the App component.
- feat: Implement internationalization, add node resource handling, and update dashboard metrics with configurable refresh.


## [0.25.0] - 2026-02-23

- feat: Implement internationalization for UI text and bump application version to 0.25.0.
- [skip ci] feat: Implement global settings management with persistence, new configurable options, and a redesigned settings UI.
- [skip ci] feat: Add search bar for Events
- feat: Redesign Logs and Overview tabs, upgrade chart version


## [0.24.0] - 2026-02-23

- [skip ci] update mock resources
- [skip ci] refactor: Remove Conditions add Host
- [skip ci] refactor: Remove duplicated Ready label


## [0.23.0] - 2026-02-23

- feat: Bump chart and application versions to 0.23.0.
- [skip ci] style: Increase UI font and icon sizes for improved readability and update chart version.
- [skip ci] refactor: update UI color palette to use semantic `info` class
- [skip ci] feat: Adjust Dashboard layout and metric card styling dynamically based on the `isCollapsed` prop.
- feat: Add startup probe configuration and enhance the display of mounted PVCs in resource details.
- [skip ci] chore: update favicon image.
- [skip ci] feat: Apply conditional styling to the dashboard navigation container based on the sidebar's collapsed state.
- [skip ci] feat: Display container health probes and mounted Persistent Volume Claims in resource details, and include probe definitions in backend examples.


## [0.22.0] - 2026-02-23

- feat: Add recent events display to resource details and update chart version to 0.22.0.
- [skip ci] refactor: restructure the metadata section into a two-column grid and update annotation font size.
- [skip ci] feat: Standardize node age format to RFC3339 and import AlertCircle icon for improved status display.
- [skip ci] feat: Add `AlertCircle` icon, refactor collapsible section UI, and improve backend node data serialization and age formatting.
- [skip ci] feat: Update theme selection UI by adding `ShieldCheck` icon and renaming theme options to 'K-view' and 'Dark'.
- [skip ci] feat: Add user information page with detailed RBAC permissions and a new backend API endpoint.
- [skip ci] feat: Add Kubernetes events listing to the UI and backend resource handling.
- [skip ci] Reorder navigation items, relocating Ingress Classes and Secrets, and updating the Custom Resources label to Custom Resource Definitions.
- [skip ci] feat: Add support for displaying ReplicaSets and Replication Controllers with their status details and dedicated UI routes.


## [0.21.0] - 2026-02-22

- feat: Implement a collapsible sidebar and bump chart version to 0.21.0.
- [skip ci] style: Introduce `--bg-dropdown` CSS variable and refine UI elements, including padding, colors, and sizes, in the main application layout and various components.
- feat: Enhance dashboard cluster overview with node readiness, auto-refresh, interactive metric cards, and refined glassmorphism styling, alongside a version bump.


## [0.20.0] - 2026-02-22

- feat: integrate NetworkTrace as a dedicated tab in ResourceDetails and add dynamic theme support for PodTerminal.


## [0.19.0] - 2026-02-22

- [skip ci] refactor: rename TerminalModal component to PodTerminal and update its usage in ResourceDetails.
- [skip ci] feat: Adjust terminal colors dynamically for light and dark themes.
- [skip ci] refactor: Adjust glassmorphism opacities, adopt CSS variables for consistent UI colors, and update the terminal to a light theme.
- [skip ci] refactor: replace specific color utility classes with semantic status color tokens and refine status indicators.


## [0.18.2] - 2026-02-22

- refactor: update RBAC assignment rendering logic in configmap and bump chart version to 0.18.2.
- [skip ci] fix: update Mermaid graph type to flowchart, sanitize edge labels, and improve error display in NetworkTraceModal.
- [skip ci] feat: Relocate 'Visual Trace' and 'Exec Terminal' actions to new tabs and update various border and text styles.
- [skip ci] style: Standardize info text color with a new CSS variable and refine light theme colors, along with minor table header border adjustments.


## [0.18.1] - 2026-02-22

- fix: Improve namespace fetching to handle direct array response and update chart/image versions to 0.18.1.
- [skip ci] feat: Add APP_VERSION environment variable to Kubernetes deployment and Docker Compose configurations.
- feat: Dynamically fetch Kubernetes namespaces for console output and update the Helm chart version.
- [ci skip] fix: Append `--as` flag to kubectl commands instead of inserting to prevent plugin parser errors.
- [skip ci] feat: Add homepage link to the About component.
- [skip ci] feat: Add an About page to the frontend that displays the application version fetched from a new backend endpoint, with the version now configurable in the Dockerfile.
- [skip ci] chore: Add `tmp/` to .gitignore and group macOS specific files.
- feat: Automatically configure kubectl for in-cluster execution using service account credentials.
- [skip ci] docs: add instructions for skipping the CI pipeline to save runner minutes.
- feat: add documentation for versioning and update release workflow to dynamically inject Helm chart versions from Git tags.
- feat: Introduce path-based conditional job execution to optimize the release workflow.


## [0.17.0] - 2026-02-21

- feat: Bump chart version to 0.17.0 and add `KVIEW_ENABLE_SSO` environment variable to deployment.
- refactor: move KVIEW_AUTHORIZED_USERS environment variable to be unconditionally defined.
- feat: Implement Google SSO whitelisting with secure-by-default behavior, improve SSO error handling UI, and fix Console RBAC impersonation.


## [0.16.0] - 2026-02-21

- feat: Implement user impersonation for real kubectl commands and RBAC simulation for mock kubectl execution based on user context.
- feat: Refactor login UI to conditionally display local authentication and streamline SSO environment variable configuration.
- feat: Introduce explicit SSO enablement via `KVIEW_ENABLE_SSO` and add support for loading environment variables from a `.env` file.
- feat: Add Google SSO user authorization whitelist configurable via `KVIEW_AUTHORIZED_USERS` environment variable.


## [0.15.0] - 2026-02-21

- feat: Bump chart and image versions to 0.15.0.
- feat: Refine console input focus, ensure consistent `kubectl` prefix, and prevent cursor movement into the prefix.
- feat: Enhance UI readability and consistency by adjusting border colors and refining modal element styling.
- feat: Add new documentation for installation, architecture, configuration, RBAC, and a changelog, and update the README to link them.


## [0.14.0] - 2026-02-21

- feat: update chart and image versions to 0.14.0 and add a demo webp to the README.
- feat: Add restart, scale, and force delete actions for Kubernetes resources.
- feat: Add a resource action menu for common operations like view, edit, export, delete, logs, and exec, integrating it into resource lists and detail views.


## [0.13.0] - 2026-02-21

- feat: Add display for resource quotas and limit ranges, and update chart version to 0.13.0.
- feat: Enhance resource management by expanding RBAC permissions and displaying namespace quotas and limits.
- style: Adjust UI spacing, padding, and logout button appearance across various components for improved visual consistency.


## [0.12.0] - 2026-02-21

- style: Refactor UI components to use CSS variables for improved theming and enhanced visual consistency.
- feat: Add custom favicon.png and update index.html to reference it.
- feat: Enhance network trace diagram by adding rich HTML labels to nodes and optional styled messages to edges.


## [0.11.0] - 2026-02-21

- feat: Update chart to version 0.11.0 and enhance resource details display logic for robustness and accuracy.


## [0.10.0] - 2026-02-21

- feat: Enhance resource list with kind-specific details and update chart to version 0.10.0.


## [0.9.0] - 2026-02-21

- feat: Update chart version to 0.9.0 and add support for defining RBAC roles for local users.
- feat: Implement WebSocket authentication via query parameter, add aliases for Kubernetes resource types, and prevent Kubernetes impersonation for admin roles.
- feat: Introduce Traefik WebSocket middleware, expand RBAC permissions, and update chart versions and default ingress settings.


## [0.8.0] - 2026-02-21

- feat: Enhance resource handling with case-insensitive kind matching, expanded resource type support, and correct namespace application for cluster-scoped resources.


## [0.7.0] - 2026-02-21

- feat: Normalize namespace parameter `"-"` to an empty string in backend handlers and update chart version to `0.7.0`.
- Refactor: Simplify Mermaid diagram generation by replacing class-based styling and rich HTML node labels with individual styling and plain text labels, and adjust theme colors.
- feat: Introduce container selection for pod logs and streamline container switching in the terminal modal.
- feat: manage active tab state using URL search parameters


## [0.6.0] - 2026-02-21

- feat: Enhance pod log viewing with search, auto-refresh, and pagination, and bump chart version to 0.6.0.
- feat: Add metrics.k8s.io API group permissions for pods and nodes to various ClusterRoles.
- feat: Implement in-memory historical CPU and RAM usage tracking and adjust sparkline chart dimensions.
- feat: Show Pod CPU and RAM usage in the resource details view.
- feat: Introduce 'External' node type to network traces, displaying detailed traffic source information and connections to Ingresses.
- feat: Add `phase` and `containerStatuses` to backend mock data and display pod readiness in the frontend.
- feat: Display mounted ConfigMaps, Secrets, and PVCs in resource details and update mock data to include volumes.
- feat: Add pod restart count and resource age to status display, and refine status phase logic.
- feat: Add a new status bar component to resource details, replacing the previous table-based status section.


## [0.5.0] - 2026-02-21

- feat: Update Helm chart to version 0.5.0, refactor pod logs API endpoint, and improve resource details UI layout for better space utilization.
- feat: Implement pod log viewing feature with a dedicated API endpoint and UI, and centralize Kubernetes client configuration for impersonation.


## [0.4.0] - 2026-02-21

- feat: Implement in-browser editing for Kubernetes resource manifests with YAML/JSON support and role-based access control.
- feat: Persist selected namespace to local storage.
- style: Refresh UI components with updated badge and card styling, adjust wallpaper display, and refine OIDC provider fallback.


## [0.2.0] - 2026-02-21

- feat: Replace SQLite-backed RBAC with declarative configuration, updating documentation and chart descriptions accordingly.


## [0.1.8] - 2026-02-21

- fix(backend): mark kind param as ignored in GetEvents to fix unused variable error
- feat(network): refine trace UI with selectors and labels, fix events tab


## [0.1.7] - 2026-02-21

- feat: Enhance network trace edge messages with target port and selector details, update pod health logic to include Succeeded status, format dashboard metrics to two decimal places, and bump chart version to 0.1.7
- fix(backend): add missing corev1 and resource imports to resources.go
- fix(frontend): handle polymorphic K8s structures in ResourceDetails to prevent blank page


## [0.1.6] - 2026-02-21

- feat: implement real-time cluster metrics and auto-detect metrics-server
- feat: Add kubectl to the Docker image, configure timezone support, update chart and image versions, and improve backend error logging.


## [0.1.5] - 2026-02-21

- feat(backend): implement dynamic list, get, events and stats for K8s API
- fix(helm): add impersonate verb to k-view serviceaccount


## [0.1.4] - 2026-02-21

- ci: tag docker image with helm chart version
- feat(helm): disable persistence and make SSO optional by default


## [0.1.3] - 2026-02-21

- fix(auth): hide dev login button in production environments unless explicitly in dev mode
- ci: add latest and short SHA tags to docker image
- fix(helm): nest rbac assignments correctly in configmap


## [0.1.2] - 2026-02-21

- fix(helm): Correct fsGroup scope and RBAC subject variable binding
- docs: Add Helm OCI installation instructions and clarify local deployment in README.
- feat: Update Helm chart's appVersion and image tag to `main`, and image repository to `ghcr.io/oisis/k-view`.


## [0.1.0] - 2026-02-21

- feat: Add a GitHub Actions workflow to publish Docker images and Helm charts.
- feat: Implement local username/password authentication for static users and dynamically display available login providers in the UI.
- feat: Implement web-based terminal for executing commands in Kubernetes pod containers.
- feat: Implement network trace visualization for Kubernetes resources using a new modal and backend API.
- feat: Add admin role-based access control to backend endpoints and frontend UI.
- feat: remove SQLite database for dynamic user roles, adopting a purely static RBAC configuration and updating related handlers and UI.
- feat: Add declarative RBAC configuration and resources for k-view.
- feat: Implement static RBAC configuration and Kubernetes client impersonation based on user roles.
- feat: Add resource details page with overview, YAML, and events for Kubernetes resources.
- feat: Introduce CSS variables for UI styling to enable theming and dark mode support.
- feat: Add cluster statistics API and integrate into dashboard UI with metric cards and charts.
- feat: Add sorting functionality to the ResourceList table columns.
- feat: Add UI and backend support for Ingress Classes and Storage Classes.
- refactor: Consolidate CRD, Namespaces, and Nodes navigation items under the Cluster section.
- feat: Update application branding with a new logo and global background, refine UI typography, and add .DS_Store to gitignore.
- feat: Implement dynamic command suggestions for `kubectl` verbs, resources, and flags.
- refactor: improve console output display with `whitespace-pre` and enhance clickable token hover effects.
- feat: Add namespace selection to filter resource lists in the UI and backend.
- feat: Add interactive console output for clickable namespaces and pod names, and enforce a 'kubectl ' command prefix.
- refactor: Streamline console UI by removing header and window chrome, enabling text selection, and refining banner display logic.
- feat: Move Console NavItem to a new 'Tools' section and set all collapsible sections to be closed by default.
- feat: Add support for namespaces, RBAC resources, network policies, and service accounts, updating backend data and frontend navigation.
- feat: Add support for displaying PersistentVolumes with mock data and UI configuration.
- feat: Introduce generic Kubernetes resource listing with a new backend endpoint and a refactored sidebar navigation.
- feat: Add a web-based console for executing kubectl commands, including a new backend handler and a frontend component.
- feat: Implement Kubernetes node listing API and display nodes in the UI.
- feat: Implement namespace filtering for pods and add a searchable namespace selector to the dashboard.
- feat: Configure Gin to serve `index.html` for all unmatched routes, enabling client-side routing.
- fix: move `/auth/me` endpoint to protected routes, requiring authentication.
- feat: Implement a development mode with a simplified dev login, dedicated Docker Compose setup, and UI indicators.
- fix: Correct pod handler loop syntax, update Dockerfile to use `go mod tidy`, and set default build architecture to arm64.
- feat: Add multi-architecture Docker build support for the backend using `TARGETARCH` and a new `build.sh` script.
- feat: Add `extraObjects` field to `values.yaml` and template to deploy arbitrary Kubernetes manifests.
- docs: Add comprehensive comments and documentation to `values.yaml` parameters, and refine default image tag and resource limits.
- feat: Implement initial Kubernetes viewer application with authentication, RBAC, admin panel, and Helm charts for deployment.
- Initial commit


