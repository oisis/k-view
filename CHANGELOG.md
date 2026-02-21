# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.16.0] - 2026-02-21

### Added
- **Google SSO Whitelisting**: Added the `KVIEW_AUTHORIZED_USERS` environment variable to restrict Google SSO login to specific email addresses. If left empty, no one can log in via SSO (secure by default).
- **Graceful SSO Error UI**: Redirects unauthorized SSO attempts to the standard login page with a user-friendly error banner, rather than returning raw JSON.
- **Collapsible Local Auth**: The local `Username/Password` login form is now elegantly hidden behind a toggle button when Google SSO is enabled, cleaning up the login page UI.

### Fixed
- **Console RBAC Impersonation**: Fixed a security issue where the in-app terminal (`Console`) bypassed Kubernetes RBAC by executing commands using the pod's default ServiceAccount. It now correctly injects `--as=<email>` to impersonate the logged-in user natively in the cluster.
- **Local Dev Auth Resolution**: Fixed a bug in `docker-compose.yaml` where the `Local user login` option disappeared if the `KVIEW_STATIC_USERS` variable was not explicitly defined in `.env`.

### Security
- **Secure Default for SSO**: Unconfigured `KVIEW_AUTHORIZED_USERS` now blocks all logins instead of allowing any verified Google account.
- **Console Terminal Limitations**: Users with the `viewer` role are now correctly prevented from running mutating commands (`apply`, `delete`, `edit`, etc.) in the `Console` simulator during `DEV_MODE`.
