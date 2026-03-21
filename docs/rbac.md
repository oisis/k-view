# Role-Based Access Control (RBAC)

K-View implements a two-tier RBAC system: **Internal User Mapping** and **Kubernetes Native RBAC**.

## 1. Internal User Mapping
K-View doesn't maintain a database. Instead, roles are assigned to users (identified by their OIDC email or local username) via a declarative configuration file or environment variables.

### Available Roles
- **viewer**: Read-only access to most resources (excluding Secrets). Default for all authenticated users.
- **admin**: Access to the Admin Panel and resource details. Can view everything but cannot delete/edit without native K8s permissions.
- **kview-cluster-admin**: Full access to all dashboard features, including management actions (Delete, Restart, Scale, Edit).
- **kview-cluster-developer**: Read-write access to workloads (Pods, Deployments, etc.) but read-only for Nodes/Namespaces.
- **kview-namespace-admin**: Full access restricted to a specific namespace.
- **kview-namespace-developer**: Read-write access to workloads restricted to a specific namespace.
- **kview-namespace-viewer**: Read-only access restricted to a specific namespace.

### Configuration (`assignments.yaml`)
```yaml
assignments:
  - user: "admin@example.com"
    role: "kview-cluster-admin"
  - user: "dev@example.com"
    role: "kview-cluster-developer"
  - user: "team-lead"
    role: "kview-namespace-admin"
    namespace: "production"
```

In Helm, this is configured via `assignments`:
```yaml
assignments:
  - user: ["oisis.dev@gmail.com", "admin@kview.local"]
    role: "kview-cluster-admin"
```

## 2. Kubernetes Native RBAC
The K-View backend runs using a ServiceAccount in the cluster. Depending on the configuration, it performs actions using its own permissions or via **Impersonation**.

### Default Service Account
By default, the `k-view-sa` service account is granted `view` permissions cluster-wide. If management actions are enabled, it is also granted `edit` and `delete` verbs for specific core resources.

### Impersonation
When enabled, K-View leverages the `Impersonate-User` header. This means that:
1. K-View checks its own internal role for the user.
2. If authorized, it passes the user's identity to Kubernetes.
3. Kubernetes evaluates its own native RBAC rules against that user.

This ensures that a user cannot bypass cluster-level security settings via the dashboard.

## 3. Admin Panel (Access Control)
Administrators can verify current permissions and assignments via the **Admin Panel** (`/rbac/status`):
- **User Details**: Displays the current user's email/username, assigned role, and effective resource permissions.
- **Role Definitions**: Shows the exact Kubernetes `ClusterRole` definitions for all K-View internal roles, including their API Groups, Resources, and Verbs.
- **Global Assignments**: A live list of all `ClusterRoleBinding` and `RoleBinding` objects in the cluster that assign K-View roles (identified by the `kview-` prefix) or are statically defined in the configuration.

## Security Best Practices
- **Least Privilege**: Only assign `kview-cluster-admin` to trusted administrators.
- **Enable TLS**: Always run K-View behind a TLS-enabled Ingress to protect OIDC and session tokens.
- **Audit Logs**: Kubernetes native RBAC provides high-quality audit logs when impersonation is used.
