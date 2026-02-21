# Role-Based Access Control (RBAC)

K-View implements a two-tier RBAC system: **Internal User Mapping** and **Kubernetes Native RBAC**.

## 1. Internal User Mapping
K-View doesn't maintain a database. Instead, roles are assigned to users (identified by their OIDC email) via a declarative configuration file.

### Available Roles
- **viewer**: Read-only access to all resources. Default for all authenticated users.
- **admin**: Access to the Admin Panel and resource details. Can view everything but cannot delete/edit without native K8s permissions.
- **kview-cluster-admin**: Full access to all dashboard features, including management actions (Delete, Restart, Scale, Edit).

### Configuration (`rbac.yaml`)
```yaml
assignments:
  - user: "admin@example.com"
    role: "kview-cluster-admin"
  - user: "dev@example.com"
    role: "admin"
```

In Helm, this is configured via `rbac.assignments`:
```yaml
rbac:
  assignments:
    - user: "oisis.dev@gmail.com"
      role: "kview-cluster-admin"
```

## 2. Kubernetes Native RBAC
The K-View backend runs using a ServiceAccount in the cluster. Depending on the configuration, it performs actions using its own permissions or via **Impersonation**.

### Default Service Account
By default, the `k-view-sa` service account is granted `view` permissions cluster-wide. If management actions are enabled, it is also granted `edit` and `delete` verbs for specific core resources.

### Impersonation
When enabled, K-View leverages the `Impersonate-User` header. This means that:
1. K-View checks its own internal role for the user.
2. If authorized, it passes the user's email to Kubernetes.
3. Kubernetes evaluates its own native RBAC rules against that user.

This ensures that a user cannot bypass cluster-level security settings via the dashboard.

## Security Best Practices
- **Least Privilege**: Only assign `kview-cluster-admin` to trusted administrators.
- **Enable TLS**: Always run K-View behind a TLS-enabled Ingress to protect OIDC tokens.
- **Audit Logs**: Kubernetes native RBAC provides high-quality audit logs when impersonation is used.
