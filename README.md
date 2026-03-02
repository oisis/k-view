# K-View: Modern Kubernetes Dashboard

K-View is a self-contained, secure, and lightweight Kubernetes dashboard built with Go (Gin) and React (Vite). It features a modern Glassmorphism UI, Google SSO (OIDC) integration, and a declarative internal RBAC system.

<a href="docs/kview_demo.webp" target="_blank">
  <img src="docs/kview_demo.webp" alt="K-View Demo" width="900" style="max-width: 100%;">
</a>

## Key Features

- **Real-time Visualization**: Resource lists and detailed views for 27+ Kubernetes resource types.
- **Native K8s Integration**: Pure `client-go` implementation with no external database requirements (stateless).
- **Network Tracing**: Visual flow analysis from Ingress to Service and Pods using Mermaid.js.
- **Security First**: Google SSO (OIDC) integration with email whitelisting.
- **Internal RBAC**: Declarative user-to-role mappings managed via Helm values or ConfigMaps.
- **Developer Friendly**: Built-in automated test suite for "Frozen Views" ensuring UI stability.

## Documentation

- **[Architecture](docs/architecture.md)**: System design and native data flow.
- **[Installation](docs/installation.md)**: Setup guides for Helm and Local Development.
- **[Configuration](docs/configuration.md)**: Environment variables and OIDC setup.
- **[RBAC](docs/rbac.md)**: Internal role mapping and Kubernetes impersonation.
- **[Changelog](docs/CHANGELOG.md)**: History of changes and versions.

## Local Development & Testing

K-View development is now natively integrated with Kubernetes (Docker Desktop / MiniKube). All legacy mockups and Docker Compose setups have been removed in favor of a real-cluster experience.

### 1. Requirements
- Docker Desktop with Kubernetes enabled (or equivalent).
- Helm 3.x.
- Go 1.22+ and Node.js 20+.

### 2. Local Deployment
We provide a streamlined script for local development that handles building, linting, deployment, and port-forwarding:

```bash
# Deploys current code to 'k-view' namespace and starts port-forwarding to :8081
./scripts/local-deploy.sh
```

### 3. Running Tests
The project includes a comprehensive test suite covering both Backend (Go) and Frontend (Vitest).

```bash
# Runs full test suite (Backend + Frontend Frozen Views)
./scripts/run-tests.sh
```

### 4. Test Data Suite
To populate your local cluster with a rich set of 27 interconnected resources for UI testing:

```bash
# Deploy unified test data (Pods, Deployments, CRDs, Networking, etc.)
./scripts/deploy-test-suite.sh --deploy

# Cleanup test data
./scripts/deploy-test-suite.sh --cleanup
```

## Quick Start Guide (Production)

### 1. Google SSO Configuration
1. Create **OAuth 2.0 Client IDs** in Google Cloud Console.
2. Add Authorized redirect URI: `https://<YOUR_DOMAIN>/api/auth/callback`.
3. Note your Client ID and Secret.

### 2. SSO Whitelisting
Set `KVIEW_AUTHORIZED_USERS` to a comma-separated list of emails to grant access:
```bash
KVIEW_AUTHORIZED_USERS=admin@example.com,dev@example.com
```

### 3. Helm Deployment
```bash
helm upgrade --install k-view ./charts/k-view \
  -n k-view --create-namespace \
  --set oidc.clientId="YOUR_CLIENT_ID" \
  --set oidc.clientSecret="YOUR_CLIENT_SECRET"
```

## Directory Structure

- `/backend`: Go Gin server and Kubernetes interaction logic.
- `/web`: React frontend with Tailwind CSS and Vitest.
- `/scripts`: Automation scripts for build, deploy, and test.
- `/examples`: Unified test suite manifests and examples.
- `/charts`: Official Helm charts for production deployment.

---
*Maintained by the K-View community.*
