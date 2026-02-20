package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// ResourceHandler serves generic Kubernetes resource lists for all resource types.
type ResourceHandler struct {
	devMode bool
}

func NewResourceHandler(devMode bool) *ResourceHandler {
	return &ResourceHandler{devMode: devMode}
}

type ResourceItem struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace,omitempty"`
	Age       string            `json:"age"`
	Status    string            `json:"status,omitempty"`
	Extra     map[string]string `json:"extra,omitempty"`
}

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")

	if !h.devMode {
		c.JSON(http.StatusNotImplemented, gin.H{"error": "real cluster not implemented for kind " + kind})
		return
	}

	items := mockResourceList(kind, ns)
	c.JSON(http.StatusOK, items)
}

func ex(kv ...string) map[string]string {
	m := make(map[string]string, len(kv)/2)
	for i := 0; i+1 < len(kv); i += 2 {
		m[kv[i]] = kv[i+1]
	}
	return m
}

func filter(items []ResourceItem, ns string) []ResourceItem {
	if ns == "" {
		return items
	}
	var filtered []ResourceItem
	for _, it := range items {
		// Non-namespaced resources (like Nodes, CRDs, PVs) have empty Namespace
		// If ns is provided, we only return those that match it, OR if it's cluster-scoped, we return all?
		// Actually, standard behavior: if ns is specified, only return namespaced items in that ns.
		if it.Namespace == ns {
			filtered = append(filtered, it)
		}
	}
	return filtered
}

func mockResourceList(kind, ns string) []ResourceItem {
	var items []ResourceItem

	switch kind {
	case "pods":
		items = []ResourceItem{
			{Name: "frontend-web-5d8f7b", Namespace: "default", Age: "19h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "backend-api-6c9f8c", Namespace: "default", Age: "4h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "worker-job-abc12", Namespace: "default", Age: "2h", Status: "CrashLoopBackOff", Extra: ex("ready", "0/1", "restarts", "8")},
			{Name: "cache-redis-001", Namespace: "default", Age: "3h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "auth-service-xyz", Namespace: "auth", Age: "1h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "oauth-proxy-001", Namespace: "auth", Age: "30m", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "postgres-primary-0", Namespace: "database", Age: "2d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "kafka-broker-0", Namespace: "messaging", Age: "3d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "prometheus-0", Namespace: "monitoring", Age: "1d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
			{Name: "alertmanager-0", Namespace: "monitoring", Age: "1h", Status: "CrashLoopBackOff", Extra: ex("ready", "0/1", "restarts", "3")},
			{Name: "coredns-5d78c9b4", Namespace: "kube-system", Age: "7d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0")},
		}

	case "deployments":
		items = []ResourceItem{
			{Name: "frontend-web", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "3/3", "up-to-date", "3", "available", "3")},
			{Name: "backend-api", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2")},
			{Name: "cache-redis", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1")},
			{Name: "auth-service", Namespace: "auth", Age: "20d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2")},
			{Name: "prometheus", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1")},
			{Name: "grafana", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1")},
			{Name: "loki", Namespace: "logging", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1")},
			{Name: "ingress-nginx-controller", Namespace: "ingress-nginx", Age: "30d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2")},
		}

	case "statefulsets":
		items = []ResourceItem{
			{Name: "postgres-primary", Namespace: "database", Age: "25d", Status: "Running", Extra: ex("ready", "1/1", "replicas", "1")},
			{Name: "postgres-replica", Namespace: "database", Age: "25d", Status: "Running", Extra: ex("ready", "2/2", "replicas", "2")},
			{Name: "kafka-broker", Namespace: "messaging", Age: "20d", Status: "Running", Extra: ex("ready", "3/3", "replicas", "3")},
			{Name: "zookeeper", Namespace: "messaging", Age: "20d", Status: "Running", Extra: ex("ready", "3/3", "replicas", "3")},
			{Name: "alertmanager", Namespace: "monitoring", Age: "28d", Status: "Degraded", Extra: ex("ready", "0/1", "replicas", "1")},
		}

	case "daemonsets":
		items = []ResourceItem{
			{Name: "fluentbit", Namespace: "logging", Age: "28d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7")},
			{Name: "kube-proxy", Namespace: "kube-system", Age: "30d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7")},
			{Name: "node-exporter", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7")},
			{Name: "calico-node", Namespace: "kube-system", Age: "30d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7")},
		}

	case "jobs":
		items = []ResourceItem{
			{Name: "db-migration-20260218", Namespace: "default", Age: "2d", Status: "Complete", Extra: ex("completions", "1/1", "duration", "12s")},
			{Name: "backup-job-20260219", Namespace: "database", Age: "1d", Status: "Complete", Extra: ex("completions", "1/1", "duration", "45s")},
			{Name: "cleanup-tokens-20260220", Namespace: "auth", Age: "4h", Status: "Complete", Extra: ex("completions", "1/1", "duration", "3s")},
			{Name: "failed-import-20260220", Namespace: "default", Age: "2h", Status: "Failed", Extra: ex("completions", "0/1", "duration", "30s")},
		}

	case "cronjobs":
		items = []ResourceItem{
			{Name: "db-backup", Namespace: "database", Age: "25d", Status: "Active", Extra: ex("schedule", "0 2 * * *", "last-schedule", "4h ago")},
			{Name: "token-cleanup", Namespace: "auth", Age: "20d", Status: "Active", Extra: ex("schedule", "0 */6 * * *", "last-schedule", "1h ago")},
			{Name: "report-generator", Namespace: "default", Age: "15d", Status: "Suspended", Extra: ex("schedule", "0 8 * * 1", "last-schedule", "7d ago")},
			{Name: "log-rotate", Namespace: "logging", Age: "28d", Status: "Active", Extra: ex("schedule", "0 0 * * *", "last-schedule", "8h ago")},
		}

	case "services":
		items = []ResourceItem{
			{Name: "kubernetes", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.0.1", "ports", "443/TCP")},
			{Name: "frontend-svc", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.12.34", "ports", "80/TCP")},
			{Name: "backend-svc", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.56.78", "ports", "8080/TCP")},
			{Name: "postgres-primary", Namespace: "database", Age: "25d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.100.1", "ports", "5432/TCP")},
			{Name: "kafka-broker", Namespace: "messaging", Age: "20d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.200.1", "ports", "9092/TCP")},
			{Name: "prometheus", Namespace: "monitoring", Age: "28d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.150.1", "ports", "9090/TCP")},
			{Name: "grafana", Namespace: "monitoring", Age: "28d", Status: "LoadBalancer", Extra: ex("cluster-ip", "10.96.150.2", "ports", "80:3000/TCP")},
		}

	case "ingresses":
		items = []ResourceItem{
			{Name: "frontend-ingress", Namespace: "default", Age: "30d", Status: "Active", Extra: ex("class", "nginx", "hosts", "app.example.com", "address", "192.168.1.100")},
			{Name: "grafana-ingress", Namespace: "monitoring", Age: "28d", Status: "Active", Extra: ex("class", "nginx", "hosts", "grafana.example.com", "address", "192.168.1.100")},
			{Name: "api-ingress", Namespace: "default", Age: "30d", Status: "Active", Extra: ex("class", "nginx", "hosts", "api.example.com", "address", "192.168.1.100")},
		}

	case "configmaps":
		items = []ResourceItem{
			{Name: "kube-root-ca.crt", Namespace: "default", Age: "30d", Extra: ex("data", "1")},
			{Name: "app-config", Namespace: "default", Age: "10d", Extra: ex("data", "5")},
			{Name: "nginx-config", Namespace: "ingress-nginx", Age: "30d", Extra: ex("data", "3")},
			{Name: "prometheus-config", Namespace: "monitoring", Age: "28d", Extra: ex("data", "8")},
			{Name: "loki-config", Namespace: "logging", Age: "28d", Extra: ex("data", "4")},
			{Name: "kafka-config", Namespace: "messaging", Age: "20d", Extra: ex("data", "12")},
			{Name: "postgres-config", Namespace: "database", Age: "25d", Extra: ex("data", "6")},
		}

	case "secrets":
		items = []ResourceItem{
			{Name: "default-token", Namespace: "default", Age: "30d", Extra: ex("type", "kubernetes.io/service-account-token", "data", "3")},
			{Name: "app-tls-secret", Namespace: "default", Age: "15d", Extra: ex("type", "kubernetes.io/tls", "data", "2")},
			{Name: "oidc-credentials", Namespace: "default", Age: "30d", Extra: ex("type", "Opaque", "data", "2")},
			{Name: "postgres-credentials", Namespace: "database", Age: "25d", Extra: ex("type", "Opaque", "data", "3")},
			{Name: "kafka-sasl-secret", Namespace: "messaging", Age: "20d", Extra: ex("type", "Opaque", "data", "2")},
		}

	case "pvcs":
		items = []ResourceItem{
			{Name: "postgres-data-pvc", Namespace: "database", Age: "25d", Status: "Bound", Extra: ex("capacity", "50Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
			{Name: "kafka-data-pvc-0", Namespace: "messaging", Age: "20d", Status: "Bound", Extra: ex("capacity", "20Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
			{Name: "kafka-data-pvc-1", Namespace: "messaging", Age: "20d", Status: "Bound", Extra: ex("capacity", "20Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
			{Name: "prometheus-data-pvc", Namespace: "monitoring", Age: "28d", Status: "Bound", Extra: ex("capacity", "10Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
			{Name: "loki-data-pvc", Namespace: "logging", Age: "28d", Status: "Bound", Extra: ex("capacity", "30Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
			{Name: "orphan-pvc", Namespace: "default", Age: "5d", Status: "Pending", Extra: ex("capacity", "5Gi", "access-mode", "ReadWriteOnce", "storage-class", "standard")},
		}

	case "crds":
		items = []ResourceItem{
			{Name: "certificates.cert-manager.io", Age: "30d", Status: "Active", Extra: ex("group", "cert-manager.io", "version", "v1", "scope", "Namespaced")},
			{Name: "clusterissuers.cert-manager.io", Age: "30d", Status: "Active", Extra: ex("group", "cert-manager.io", "version", "v1", "scope", "Cluster")},
			{Name: "prometheusrules.monitoring.coreos.com", Age: "28d", Status: "Active", Extra: ex("group", "monitoring.coreos.com", "version", "v1", "scope", "Namespaced")},
			{Name: "servicemonitors.monitoring.coreos.com", Age: "28d", Status: "Active", Extra: ex("group", "monitoring.coreos.com", "version", "v1", "scope", "Namespaced")},
			{Name: "ingressclasses.networking.k8s.io", Age: "30d", Status: "Active", Extra: ex("group", "networking.k8s.io", "version", "v1", "scope", "Cluster")},
			{Name: "kafkatopics.kafka.strimzi.io", Age: "20d", Status: "Active", Extra: ex("group", "kafka.strimzi.io", "version", "v1beta2", "scope", "Namespaced")},
		}
	case "pvs":
		items = []ResourceItem{
			{Name: "pv-postgres-primary", Age: "25d", Status: "Bound", Extra: ex("capacity", "50Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Retain", "storage-class", "standard", "claim", "database/postgres-data-pvc")},
			{Name: "pv-kafka-0", Age: "20d", Status: "Bound", Extra: ex("capacity", "20Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Retain", "storage-class", "standard", "claim", "messaging/kafka-data-pvc-0")},
			{Name: "pv-kafka-1", Age: "20d", Status: "Bound", Extra: ex("capacity", "20Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Retain", "storage-class", "standard", "claim", "messaging/kafka-data-pvc-1")},
			{Name: "pv-prometheus", Age: "28d", Status: "Bound", Extra: ex("capacity", "10Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Delete", "storage-class", "standard", "claim", "monitoring/prometheus-data-pvc")},
			{Name: "pv-loki", Age: "28d", Status: "Bound", Extra: ex("capacity", "30Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Delete", "storage-class", "standard", "claim", "logging/loki-data-pvc")},
			{Name: "pv-released-old", Age: "10d", Status: "Released", Extra: ex("capacity", "5Gi", "access-mode", "ReadWriteOnce", "reclaim-policy", "Retain", "storage-class", "standard", "claim", "default/old-pvc")},
			{Name: "pv-available-spare", Age: "3d", Status: "Available", Extra: ex("capacity", "100Gi", "access-mode", "ReadWriteMany", "reclaim-policy", "Retain", "storage-class", "fast-ssd", "claim", "")},
		}

	case "cluster-role-bindings":
		items = []ResourceItem{
			{Name: "cluster-admin", Age: "30d", Extra: ex("role", "ClusterRole/cluster-admin", "subjects", "system:masters")},
			{Name: "kview-sa-binding", Age: "30d", Extra: ex("role", "ClusterRole/kview-cluster-reader", "subjects", "ServiceAccount/kview-sa")},
			{Name: "ingress-nginx-binding", Age: "30d", Extra: ex("role", "ClusterRole/ingress-nginx", "subjects", "ServiceAccount/ingress-nginx")},
			{Name: "cert-manager-binding", Age: "30d", Extra: ex("role", "ClusterRole/cert-manager-controller", "subjects", "ServiceAccount/cert-manager")},
			{Name: "prometheus-binding", Age: "28d", Extra: ex("role", "ClusterRole/prometheus", "subjects", "ServiceAccount/prometheus")},
			{Name: "calico-binding", Age: "30d", Extra: ex("role", "ClusterRole/calico-node", "subjects", "ServiceAccount/calico-node")},
		}

	case "cluster-roles":
		items = []ResourceItem{
			{Name: "cluster-admin", Age: "30d", Extra: ex("rules", "* on */*")},
			{Name: "kview-cluster-reader", Age: "30d", Extra: ex("rules", "get, list, watch on pods, nodes, ns")},
			{Name: "ingress-nginx", Age: "30d", Extra: ex("rules", "get, list, watch on ingresses, services")},
			{Name: "cert-manager-controller", Age: "30d", Extra: ex("rules", "* on certificates, issuers")},
			{Name: "prometheus", Age: "28d", Extra: ex("rules", "get, list, watch on pods, nodes, services")},
			{Name: "view", Age: "30d", Extra: ex("rules", "get, list, watch on most resources")},
			{Name: "edit", Age: "30d", Extra: ex("rules", "get, list, watch, create, update, delete")},
		}

	case "namespaces":
		items = []ResourceItem{
			{Name: "default", Age: "30d", Status: "Active"},
			{Name: "auth", Age: "30d", Status: "Active"},
			{Name: "database", Age: "25d", Status: "Active"},
			{Name: "messaging", Age: "20d", Status: "Active"},
			{Name: "monitoring", Age: "28d", Status: "Active"},
			{Name: "logging", Age: "28d", Status: "Active"},
			{Name: "ingress-nginx", Age: "30d", Status: "Active"},
			{Name: "cert-manager", Age: "30d", Status: "Active"},
			{Name: "kube-system", Age: "30d", Status: "Active"},
			{Name: "kube-public", Age: "30d", Status: "Active"},
			{Name: "kube-node-lease", Age: "30d", Status: "Active"},
		}

	case "network-policies":
		items = []ResourceItem{
			{Name: "deny-all-ingress", Namespace: "default", Age: "15d", Extra: ex("pod-selector", "<all>", "policy-types", "Ingress")},
			{Name: "allow-frontend-to-backend", Namespace: "default", Age: "15d", Extra: ex("pod-selector", "app=frontend", "policy-types", "Egress")},
			{Name: "allow-backend-to-db", Namespace: "database", Age: "20d", Extra: ex("pod-selector", "app=postgres", "policy-types", "Ingress")},
			{Name: "deny-all-ingress", Namespace: "messaging", Age: "20d", Extra: ex("pod-selector", "<all>", "policy-types", "Ingress")},
			{Name: "allow-prometheus-scrape", Namespace: "monitoring", Age: "28d", Extra: ex("pod-selector", "<all>", "policy-types", "Ingress")},
		}

	case "role-bindings":
		items = []ResourceItem{
			{Name: "admin-binding", Namespace: "default", Age: "30d", Extra: ex("role", "ClusterRole/admin", "subjects", "User/admin@kview.local")},
			{Name: "db-admin-binding", Namespace: "database", Age: "25d", Extra: ex("role", "Role/db-admin", "subjects", "ServiceAccount/postgres-sa")},
			{Name: "kafka-admin-binding", Namespace: "messaging", Age: "20d", Extra: ex("role", "Role/kafka-admin", "subjects", "ServiceAccount/kafka-sa")},
			{Name: "grafana-viewer", Namespace: "monitoring", Age: "28d", Extra: ex("role", "Role/viewer", "subjects", "Group/developers")},
		}

	case "roles":
		items = []ResourceItem{
			{Name: "db-admin", Namespace: "database", Age: "25d", Extra: ex("rules", "* on pods, services, configmaps")},
			{Name: "kafka-admin", Namespace: "messaging", Age: "20d", Extra: ex("rules", "* on pods, services, configmaps")},
			{Name: "viewer", Namespace: "monitoring", Age: "28d", Extra: ex("rules", "get, list on pods, services")},
			{Name: "log-reader", Namespace: "logging", Age: "28d", Extra: ex("rules", "get, list on pods, configmaps")},
		}

	case "service-accounts":
		items = []ResourceItem{
			{Name: "default", Namespace: "default", Age: "30d", Extra: ex("secrets", "1")},
			{Name: "kview-sa", Namespace: "default", Age: "30d", Extra: ex("secrets", "1")},
			{Name: "postgres-sa", Namespace: "database", Age: "25d", Extra: ex("secrets", "1")},
			{Name: "kafka-sa", Namespace: "messaging", Age: "20d", Extra: ex("secrets", "1")},
			{Name: "prometheus", Namespace: "monitoring", Age: "28d", Extra: ex("secrets", "2")},
			{Name: "grafana", Namespace: "monitoring", Age: "28d", Extra: ex("secrets", "1")},
			{Name: "cert-manager", Namespace: "cert-manager", Age: "30d", Extra: ex("secrets", "1")},
			{Name: "ingress-nginx", Namespace: "ingress-nginx", Age: "30d", Extra: ex("secrets", "1")},
		}
	}

	return filter(items, ns)
}
