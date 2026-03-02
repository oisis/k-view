# Installation Guide

K-View can be installed in several ways depending on your environment (local development vs. production cluster).

## Prerequisites
- **Kubernetes**: v1.22+
- **Helm**: v3.0+
- **Docker**: For building and local cluster execution.

## 1. Quick Install (Helm OCI)
The fastest way to deploy K-View is using pre-built charts from GHCR.

```bash
helm install k-view oci://ghcr.io/oisis/charts/k-view \
  --version main \
  --set oidc.clientId=YOUR_CLIENT_ID \
  --set oidc.clientSecret=YOUR_CLIENT_SECRET \
  --set ingress.host=kview.yourdomain.com \
  -n k-view --create-namespace
```

## 2. Local Development (Docker Desktop / MiniKube)
The development environment is natively integrated with Kubernetes. Legacy mockups and Docker Compose have been removed.

### 1. Initial Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/oisis/k-view.git
   cd k-view
   ```
2. Configure your local settings in `tmp-gemini/my-values.yaml`.

### 2. Streamlined Deployment
Use our automation script to build, deploy, and start a port-forward tunnel:
```bash
./scripts/local-deploy.sh
```
The application will be available at **http://localhost:8081**.

### 3. Deploying Metrics Server
To see CPU/RAM charts locally, ensure Metrics Server is installed:
```bash
./scripts/metrics-server.sh
```

### 4. Deploying Test Data
To populate the dashboard with 27 example resources:
```bash
./scripts/deploy-test-suite.sh --deploy
```

## 3. Building from Source
K-View uses a multi-stage Docker build supporting multiple architectures.

### Local Image Build
```bash
docker build -t k-view:latest .
```

### Build & Extract Binary
To build the Go binary for a specific architecture (e.g., `arm64` for Mac M1/M2):
```bash
./scripts/build.sh arm64
```
The binary will be saved in the `bin/` directory.

## 4. Running Tests
Ensure UI stability and backend correctness before contributing:
```bash
./scripts/run-tests.sh
```
This script runs both Go backend tests and Vitest frontend tests (Frozen Views).
