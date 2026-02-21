# Configuration Reference

K-View is configured primarily via environment variables (for the backend) and `values.yaml` (for Helm deployments).

## Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port on which the backend server runs. | `8080` |
| `DEV_MODE` | Enables mock data and simplified login for local development. | `false` |
| `OIDC_CLIENT_ID` | OAuth2 Client ID for Google SSO. | (Required) |
| `OIDC_CLIENT_SECRET` | OAuth2 Client Secret for Google SSO. | (Required) |
| `OIDC_ISSUER` | OIDC Issuer URL. | `https://accounts.google.com` |
| `KVIEW_REDIRECT_URI` | Authorized redirect URI for OAuth2. | (Computed) |
| `RBAC_CONFIG_FILE` | Path to the YAML file defining role assignments. | `/etc/k-view/rbac.yaml` |

## Helm Configuration (`values.yaml`)

### OIDC Setup
```yaml
oidc:
  enabled: true
  issuer: "https://accounts.google.com"
  clientId: "xxx-google-client-id-xxx"
  clientSecret: "xxx-google-client-secret-xxx"
```

### Ingress
```yaml
ingress:
  enabled: true
  className: "nginx"
  host: "k-view.example.com"
  tls: true
```

### Resource Limits
```yaml
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

## Google SSO (OIDC) Setup Guide
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create/Select a project.
3. Navigate to **APIs & Services > Credentials**.
4. Create **OAuth 2.0 Client IDs** (Type: Web application).
5. Add **Authorized redirect URIs**: `https://<your-host>/api/auth/callback`.
6. Copy the Client ID and Secret to your `values.yaml` or container environment.
