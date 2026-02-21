package handlers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"sigs.k8s.io/yaml"

	"k-view/k8s"
)

type ResourceHandler struct {
	devMode   bool
	k8sClient k8s.KubernetesProvider
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{devMode: devMode, k8sClient: k8sClient}
}

// getGVR maps frontend URL :kind parameters to K8s schema.GroupVersionResource
func getGVR(kind string) schema.GroupVersionResource {
	switch kind {
	case "pods":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	case "deployments":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	case "statefulsets":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
	case "daemonsets":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
	case "jobs":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
	case "cronjobs":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	case "services":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}
	case "ingresses":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
	case "ingress-classes":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
	case "storage-classes":
		return schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
	case "configmaps":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}
	case "secrets":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}
	case "pvcs":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
	case "crds":
		return schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	case "pvs":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
	case "cluster-role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	case "cluster-roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	case "namespaces":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}
	case "network-policies":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
	case "role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	case "roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	case "service-accounts":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
	default:
		// Attempt to query core v1 if unknown
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: kind}
	}
}

func getAge(t time.Time) string {
	if t.IsZero() {
		return "Unknown"
	}
	d := time.Since(t)
	if d.Hours() > 24 {
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	} else if d.Hours() > 1 {
		return fmt.Sprintf("%dh", int(d.Hours()))
	} else if d.Minutes() > 1 {
		return fmt.Sprintf("%dm", int(d.Minutes()))
	}
	return fmt.Sprintf("%ds", int(d.Seconds()))
}

type ResourceItem struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace,omitempty"`
	Age       string            `json:"age"`
	Status    string            `json:"status,omitempty"`
	Extra     map[string]string `json:"extra,omitempty"`
}

type MetricHistory struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

type ClusterStats struct {
	K8sVersion     string          `json:"k8sVersion"`
	NodeCount      int             `json:"nodeCount"`
	PodCount       int             `json:"podCount"`
	PodCountFailed int             `json:"podCountFailed"`
	CPUUsage       float64         `json:"cpuUsage"` // Percentage
	CPUTotal       string          `json:"cpuTotal"` // e.g., "32 Cores"
	RAMUsage       float64         `json:"ramUsage"` // Percentage
	RAMTotal       string          `json:"ramTotal"` // e.g., "128 GiB"
	ClusterName    string          `json:"clusterName"`
	ETCDHealth     string          `json:"etcdHealth"`
	MetricsServer  bool            `json:"metricsServer"`
	CPUHistory     []MetricHistory `json:"cpuHistory"`
	RAMHistory     []MetricHistory `json:"ramHistory"`
}

func (h *ResourceHandler) GetStats(c *gin.Context) {
	if h.devMode {
		// Mock data for development
		stats := ClusterStats{
			K8sVersion:     "v1.28.2",
			NodeCount:      7,
			PodCount:       156,
			PodCountFailed: 4,
			CPUUsage:       42.5,
			CPUTotal:       "32 Cores",
			RAMUsage:       65.2,
			RAMTotal:       "128 GiB",
			ClusterName:    "development-mock",
			ETCDHealth:     "Healthy",
			MetricsServer:  true,
			CPUHistory: []MetricHistory{
				{Timestamp: "08:00", Value: 35.0},
				{Timestamp: "09:00", Value: 42.0},
			},
			RAMHistory: []MetricHistory{
				{Timestamp: "08:00", Value: 60.0},
				{Timestamp: "09:00", Value: 62.0},
			},
		}
		c.JSON(http.StatusOK, stats)
		return
	}

	// Real dynamic cluster stats
	nodes, err := h.k8sClient.ListNodes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusOK, ClusterStats{ClusterName: "k-cluster (limited access)"}) // fail gracefully for viewers
		return
	}

	pods, _ := h.k8sClient.ListPods(c.Request.Context(), "")

	var cpuTotalInt, ramTotalInt int64
	for _, n := range nodes {
		cpuTotalInt += n.Status.Capacity.Cpu().Value()
		ramTotalInt += n.Status.Capacity.Memory().Value() / (1024 * 1024 * 1024)
	}

	failedPods := 0
	for _, p := range pods {
		if p.Status.Phase == "Failed" {
			failedPods++
		}
	}

	stats := ClusterStats{
		K8sVersion:     "Unknown",
		NodeCount:      len(nodes),
		PodCount:       len(pods),
		PodCountFailed: failedPods,
		CPUUsage:       0.0, // Metrics API needed for real live usage
		CPUTotal:       fmt.Sprintf("%d Cores", cpuTotalInt),
		RAMUsage:       0.0,
		RAMTotal:       fmt.Sprintf("%d GiB", ramTotalInt),
		ClusterName:    "Kubernetes",
		ETCDHealth:     "Unknown",
		MetricsServer:  false,
		CPUHistory:     []MetricHistory{},
		RAMHistory:     []MetricHistory{},
	}

	if len(nodes) > 0 {
		stats.K8sVersion = nodes[0].Status.NodeInfo.KubeletVersion
	}

	c.JSON(http.StatusOK, stats)
}

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		ns = rbacNs.(string)
	}

	// Serve mock data if running in developer mode
	if h.devMode {
		items := mockResourceList(kind, ns)
		c.JSON(http.StatusOK, items)
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	
	var listInterface dynamic.ResourceInterface
	if ns != "" {
		listInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		listInterface = dynClient.Resource(gvr)
	}

	unstructuredList, err := listInterface.List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list resources: " + err.Error()})
		return
	}

	var items []ResourceItem
	for _, item := range unstructuredList.Items {
		name := item.GetName()
		namespace := item.GetNamespace()
		age := getAge(item.GetCreationTimestamp().Time)
		
		status := "Active"
		if statusMap, ok := item.Object["status"].(map[string]interface{}); ok {
			if phase, ok := statusMap["phase"].(string); ok {
				status = phase
			} else if conditions, ok := statusMap["conditions"].([]interface{}); ok && len(conditions) > 0 {
				if condMap, ok := conditions[len(conditions)-1].(map[string]interface{}); ok {
					if condType, ok := condMap["type"].(string); ok {
						status = condType
					}
				}
			}
		}

		items = append(items, ResourceItem{
			Name:      name,
			Namespace: namespace,
			Age:       age,
			Status:    status,
			Extra:     map[string]string{"kind": item.GetKind()},
		})
	}

	c.JSON(http.StatusOK, items)
}

func (h *ResourceHandler) GetDetails(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if ns != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
			return
		}
	}

	if h.devMode {
		items := mockResourceList(kind, ns)
		var found *ResourceItem
		for _, it := range items {
			if it.Name == name {
				found = &it
				break
			}
		}

		if found == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
			return
		}

		details := gin.H{
			"resource": found,
			"metadata": gin.H{
				"name":              found.Name,
				"namespace":         found.Namespace,
				"uid":               "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
				"creationTimestamp": "2024-02-18T10:00:00Z",
				"labels":            gin.H{"app": found.Name, "env": "prod", "version": "1.2.0"},
				"annotations":       gin.H{"kview.io/managed-by": "k-view", "deployment.kubernetes.io/revision": "4"},
			},
			"spec": gin.H{
				"replicas": 3,
				"selector": gin.H{"matchLabels": gin.H{"app": found.Name}},
				"template": gin.H{
					"spec": gin.H{
						"containers": []gin.H{
							{
								"name":  "main",
								"image": "nginx:1.21",
								"ports": []gin.H{{"containerPort": 80}},
							},
						},
					},
				},
			},
			"status": gin.H{
				"replicas":            3,
				"readyReplicas":       3,
				"updatedReplicas":     3,
				"availableReplicas":   3,
				"observedGeneration": 4,
			},
		}

		c.JSON(http.StatusOK, details)
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	var resInterface dynamic.ResourceInterface
	if ns != "" {
		resInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		resInterface = dynClient.Resource(gvr)
	}

	item, err := resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found: " + err.Error()})
		return
	}

	// We wrap it in the expected frontend payload if necessary,
	// but sending the raw object provides identical .metadata, .spec, and .status fields!
	wrapped := gin.H{
		"resource": gin.H{
			"name":      item.GetName(),
			"namespace": item.GetNamespace(),
			"age":       getAge(item.GetCreationTimestamp().Time),
		},
		"metadata": item.Object["metadata"],
		"spec":     item.Object["spec"],
		"status":   item.Object["status"],
	}

	c.JSON(http.StatusOK, wrapped)
}

func (h *ResourceHandler) GetYAML(c *gin.Context) {
	name := c.Param("name")
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if ns != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
			return
		}
	}

	if h.devMode {
		yamlMock := `apiVersion: apps/v1
kind: ` + strings.Title(kind) + `
metadata:
  name: ` + name + `
  namespace: default
  labels:
    app: ` + name + `
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ` + name + `
  template:
    metadata:
      labels:
        app: ` + name + `
    spec:
      containers:
      - name: main
        image: nginx:1.21
        ports:
        - containerPort: 80`
		c.String(http.StatusOK, yamlMock)
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	var resInterface dynamic.ResourceInterface
	if ns != "" {
		resInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		resInterface = dynClient.Resource(gvr)
	}

	item, err := resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found: " + err.Error()})
		return
	}

	// Remove noisy managed fields for cleaner YAML formatting
	unstructured.RemoveNestedField(item.Object, "metadata", "managedFields")

	yamlData, err := yaml.Marshal(item.Object)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal to YAML"})
		return
	}

	c.String(http.StatusOK, string(yamlData))
}

func (h *ResourceHandler) GetEvents(c *gin.Context) {
	name := c.Param("name")
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if ns != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
			return
		}
	}

	if h.devMode {
		events := []gin.H{
			{"type": "Normal", "reason": "ScalingReplicaSet", "message": "Scaled up replica set to 3", "age": "10h"},
		}
		c.JSON(http.StatusOK, events)
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	var resInterface dynamic.ResourceInterface
	if ns != "" {
		resInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		resInterface = dynClient.Resource(gvr)
	}

	targetResource, err := resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found: " + err.Error()})
		return
	}
	uid := targetResource.GetUID()

	eventsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	eventList, err := dynClient.Resource(eventsGVR).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{
		FieldSelector: "involvedObject.uid=" + string(uid),
	})
	if err != nil {
		// Just output empty if events can't be listed or selector not supported
		c.JSON(http.StatusOK, []gin.H{})
		return
	}

	var events []gin.H
	for _, e := range eventList.Items {
		eType, _, _ := unstructured.NestedString(e.Object, "type")
		reason, _, _ := unstructured.NestedString(e.Object, "reason")
		message, _, _ := unstructured.NestedString(e.Object, "message")
		
		var t time.Time
		if lastTimestamp, ok, _ := unstructured.NestedString(e.Object, "lastTimestamp"); ok && lastTimestamp != "" {
			t, _ = time.Parse(time.RFC3339, lastTimestamp)
		} else if eventTime, ok, _ := unstructured.NestedString(e.Object, "eventTime"); ok && eventTime != "" {
			t, _ = time.Parse(time.RFC3339Nano, eventTime)
		}

		events = append(events, gin.H{
			"type":    eType,
			"reason":  reason,
			"message": message,
			"age":     getAge(t),
		})
	}

	c.JSON(http.StatusOK, events)
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

	case "ingress-classes":
		items = []ResourceItem{
			{Name: "nginx", Age: "30d", Status: "Default", Extra: ex("controller", "k8s.io/ingress-nginx")},
			{Name: "gce", Age: "30d", Extra: ex("controller", "k8s.io/gce-ingress-l7")},
		}

	case "storage-classes":
		items = []ResourceItem{
			{Name: "standard", Age: "30d", Status: "Default", Extra: ex("provisioner", "kubernetes.io/gce-pd", "reclaim-policy", "Delete", "volume-binding-mode", "Immediate")},
			{Name: "premium-rwo", Age: "30d", Extra: ex("provisioner", "kubernetes.io/gce-pd", "reclaim-policy", "Retain", "volume-binding-mode", "WaitForFirstConsumer")},
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
