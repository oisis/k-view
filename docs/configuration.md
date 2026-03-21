# Configuration Reference

K-View is configured primarily via environment variables (for the backend) and `values.yaml` (for Helm deployments).

## Environment Variables (Backend)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port on which the backend server runs. | `8080` |
| `DEV_MODE` | Enables mock data and simplified login for local development. | `false` |
| `KVIEW_ENABLE_SSO` | Globally enable or disable Google SSO login. | `true` |
| `KVIEW_GOOGLE_CLIENT_ID` | OAuth2 Client ID for Google SSO. | (Required for SSO) |
| `KVIEW_GOOGLE_CLIENT_SECRET` | OAuth2 Client Secret for Google SSO. | (Required for SSO) |
| `KVIEW_OAUTH_REDIRECT_URL` | Authorized redirect URI for OAuth2. | `http://localhost:8080/api/auth/callback` |
| `KVIEW_AUTHORIZED_USERS` | Comma-separated list of emails allowed to log in via SSO. | (Empty = None) |
| `KVIEW_STATIC_USERS` | JSON array of static users: `[{"username":"admin","password_hash":"..."}]`. | (Empty) |
| `KVIEW_JWT_SECRET` | Secret key for signing local session JWTs. | (Generated if empty) |
| `KVIEW_AUTH_FILE_PATH` | Path to a YAML file containing static users. | `/etc/kview/auth/users.yaml` |
| `RBAC_CONFIG_PATH` | Path to the YAML file defining role assignments. | `/etc/kview/rbac/assignments.yaml` |
| `APP_VERSION` | Version string displayed in the UI. | `unknown` |

## Helm Configuration (`values.yaml`)

### OIDC Setup
```yaml
enable_sso: true
secrets:
  googleClientId: "xxx-google-client-id-xxx"
  googleClientSecret: "xxx-google-client-secret-xxx"
env:
  oauthRedirectUrl: "https://kview.example.com/api/auth/callback"
# SSO Whitelist is managed via assignments or KVIEW_AUTHORIZED_USERS env
```

### Local Static Users
```yaml
localUsers:
  - username: "admin"
    password_hash: "$2a$10$..." # Bcrypt hash
    role: "kview-cluster-admin"
```

### Ingress
```yaml
ingress:
  enabled: true
  className: "traefik"
  hosts:
    - host: kview.example.com
      paths:
        - path: /
          pathType: ImplementationSpecific
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
