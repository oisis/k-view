# Installation Guide

K-View can be installed in several ways depending on your environment (local development vs. production cluster).

## Prerequisites
- **Kubernetes**: v1.22+
- **Helm**: v3.0+ (for cluster deployment)
- **Docker**: (optional, for custom builds)

## 1. Quick Install (Helm OCI)
The fastest way to deploy K-View is using our pre-built charts from GHCR.

```bash
helm install k-view oci://ghcr.io/oisis/charts/k-view \
  --version main \
  --set oidc.clientId=YOUR_CLIENT_ID \
  --set oidc.clientSecret=YOUR_CLIENT_SECRET \
  --set ingress.host=kview.yourdomain.com \
  -n k-view --create-namespace
```

## 2. Manual Installation (Local Clone)
If you want to customize the chart or use a local `values.yaml`:

1. Clone the repository:
   ```bash
   git clone https://github.com/oisis/k-view.git
   cd k-view
   ```
2. Adjust `charts/k-view/values.yaml`.
3. Install:
   ```bash
   helm install k-view ./charts/k-view -n k-view --create-namespace
   ```

## 3. Local Development (Docker Compose)
For testing features locally without a real Kubernetes cluster:

1. Enable `DEV_MODE` in the backend.
2. Run via Docker Compose:
   ```bash
   docker-compose up -d
   ```
   This will start a mock backend and a proxied frontend on `http://localhost:8080`.

## 4. Building from Source
K-View uses a multi-stage Docker build to keep the final image lightweight.

```bash
docker build -t k-view:latest .
```

To build for a specific architecture (e.g., Apple Silicon):
```bash
docker build --build-arg TARGETARCH=arm64 -t k-view:arm64 .
```
or use our build script:
```bash
./build.sh
```
