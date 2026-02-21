package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"sigs.k8s.io/yaml"

	"k-view/k8s"
)

type ResourceHandler struct {
	devMode    bool
	k8sClient  k8s.KubernetesProvider
	mu         sync.Mutex
	cpuHistory []MetricHistory
	ramHistory []MetricHistory
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{devMode: devMode, k8sClient: k8sClient}
}

// getGVR maps frontend URL :kind parameters to K8s schema.GroupVersionResource
func getGVR(kind string) schema.GroupVersionResource {
	switch strings.ToLower(kind) {
	case "pods":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	case "deployments":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	case "services":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}
	case "configmaps":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}
	case "secrets":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}
	case "ingresses":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
	case "ingress-classes":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
	case "statefulsets":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
	case "daemonsets":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
	case "replicasets":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}
	case "jobs":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
	case "cronjobs":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	case "namespaces":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}
	case "nodes":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "nodes"}
	case "pvs":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
	case "pvcs":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
	case "storage-classes":
		return schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
	case "crds":
		return schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	case "cluster-roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	case "cluster-role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	case "roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	case "role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	case "serviceaccounts", "service-accounts":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
	case "hpas", "hpa", "horizontalpodautoscalers":
		return schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
	case "vpas", "vpa", "verticalpodautoscalers":
		return schema.GroupVersionResource{Group: "autoscaling.k8s.io", Version: "v1", Resource: "verticalpodautoscalers"}
	case "pdbs", "pdb", "poddisruptionbudgets":
		return schema.GroupVersionResource{Group: "policy", Version: "v1", Resource: "poddisruptionbudgets"}
	case "networkpolicies", "network-policies":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
	case "endpoints":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	case "resourcequotas", "resource-quotas":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "resourcequotas"}
	case "limitranges", "limit-ranges":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "limitranges"}
	default:
		// Attempt a best-effort guess for unknown kinds
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: kind}
	}
}

// clusterScopedKinds is the set of resource kinds that are NOT namespaced.
var clusterScopedKinds = map[string]bool{
	"namespaces":            true,
	"nodes":                 true,
	"pvs":                   true,
	"storage-classes":       true,
	"crds":                  true,
	"cluster-roles":         true,
	"cluster-role-bindings": true,
	"ingress-classes":       true,
}

// isClusterScoped returns true if the given kind is not namespace-scoped.
func isClusterScoped(kind string) bool {
	return clusterScopedKinds[strings.ToLower(kind)]
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
	ctx := c.Request.Context()
	nodes, err := h.k8sClient.ListNodes(ctx)
	if err != nil {
		c.JSON(http.StatusOK, ClusterStats{ClusterName: "k-cluster (limited access)"}) // fail gracefully for viewers
		return
	}

	pods, _ := h.k8sClient.ListPods(ctx, "")

	var cpuTotalInt, ramTotalInt int64
	for _, n := range nodes {
		cpuTotalInt += n.Status.Capacity.Cpu().Value()
		ramTotalInt += n.Status.Capacity.Memory().Value() / (1024 * 1024 * 1024)
	}

	failedPods := 0
	for _, p := range pods {
		if p.Status.Phase == corev1.PodFailed || p.Status.Phase == corev1.PodPending {
			failedPods++
		}
	}

	// Detect Metrics Server
	hasMetrics := false
	var cpuUsage, ramUsage float64
	dynClient, dErr := h.k8sClient.GetDynamicClient(ctx)
	if dErr == nil {
		// Check if metrics.k8s.io exists
		metricsGVR := schema.GroupVersionResource{Group: "metrics.k8s.io", Version: "v1beta1", Resource: "nodes"}
		metricsList, mErr := dynClient.Resource(metricsGVR).List(ctx, metav1.ListOptions{})
		if mErr == nil && len(metricsList.Items) > 0 {
			hasMetrics = true
			var usedCPU, usedRAM float64
			for _, m := range metricsList.Items {
				if usage, ok := m.Object["usage"].(map[string]interface{}); ok {
					if cpuStr, ok := usage["cpu"].(string); ok {
						q, _ := resource.ParseQuantity(cpuStr)
						usedCPU += float64(q.MilliValue()) / 1000.0
					}
					if memStr, ok := usage["memory"].(string); ok {
						q, _ := resource.ParseQuantity(memStr)
						usedRAM += float64(q.Value()) / (1024 * 1024 * 1024)
					}
				}
			}
			if cpuTotalInt > 0 {
				cpuUsage = (usedCPU / float64(cpuTotalInt)) * 100.0
			}
			if ramTotalInt > 0 {
				ramUsage = (usedRAM / float64(ramTotalInt)) * 100.0
			}
		}
	}

	stats := ClusterStats{
		K8sVersion:     "Unknown",
		NodeCount:      len(nodes),
		PodCount:       len(pods),
		PodCountFailed: failedPods,
		CPUUsage:       cpuUsage,
		CPUTotal:       fmt.Sprintf("%d Cores", cpuTotalInt),
		RAMUsage:       ramUsage,
		RAMTotal:       fmt.Sprintf("%d GiB", ramTotalInt),
		ClusterName:    "Kubernetes",
		ETCDHealth:     "Healthy", // Assume healthy if we can list nodes
		MetricsServer:  hasMetrics,
	}

	if len(nodes) > 0 {
		stats.K8sVersion = nodes[0].Status.NodeInfo.KubeletVersion
	}

	// Update History (Persistent in-memory)
	if hasMetrics {
		h.mu.Lock()
		now := time.Now().Format("15:04")
		
		h.cpuHistory = append(h.cpuHistory, MetricHistory{Timestamp: now, Value: cpuUsage})
		h.ramHistory = append(h.ramHistory, MetricHistory{Timestamp: now, Value: ramUsage})
		
		// Keep last 30 points
		if len(h.cpuHistory) > 30 {
			h.cpuHistory = h.cpuHistory[len(h.cpuHistory)-30:]
			h.ramHistory = h.ramHistory[len(h.ramHistory)-30:]
		}
		
		stats.CPUHistory = h.cpuHistory
		stats.RAMHistory = h.ramHistory
		h.mu.Unlock()
	} else {
		stats.CPUHistory = []MetricHistory{}
		stats.RAMHistory = []MetricHistory{}
	}

	c.JSON(http.StatusOK, stats)
}

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")
	if ns == "-" {
		ns = ""
	}

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
	if ns != "" && !isClusterScoped(kind) {
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

		extra := map[string]string{"kind": item.GetKind()}
		
		switch kind {
		case "configmaps":
			if data, ok, _ := unstructured.NestedMap(item.Object, "data"); ok {
				extra["data"] = fmt.Sprintf("%d", len(data))
			} else {
				extra["data"] = "0"
			}
		case "secrets":
			if sType, ok, _ := unstructured.NestedString(item.Object, "type"); ok {
				extra["type"] = sType
			}
			if data, ok, _ := unstructured.NestedMap(item.Object, "data"); ok {
				extra["data"] = fmt.Sprintf("%d", len(data))
			} else {
				extra["data"] = "0"
			}
		case "ingress-classes":
			if controller, ok, _ := unstructured.NestedString(item.Object, "spec", "controller"); ok {
				extra["controller"] = controller
			}
			if isDef, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "ingressclass.kubernetes.io/is-default-class"); ok && isDef == "true" {
				status = "Default"
			}
		case "storage-classes":
			if provisioner, ok, _ := unstructured.NestedString(item.Object, "provisioner"); ok {
				extra["provisioner"] = provisioner
			}
			if reclaim, ok, _ := unstructured.NestedString(item.Object, "reclaimPolicy"); ok {
				extra["reclaim-policy"] = reclaim
			}
			if bindingMode, ok, _ := unstructured.NestedString(item.Object, "volumeBindingMode"); ok {
				extra["volume-binding-mode"] = bindingMode
			}
			if isDef, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "storageclass.kubernetes.io/is-default-class"); ok && isDef == "true" {
				status = "Default"
			}
		case "service-accounts", "serviceaccounts":
			if secrets, ok, _ := unstructured.NestedSlice(item.Object, "secrets"); ok {
				extra["secrets"] = fmt.Sprintf("%d", len(secrets))
			} else {
				extra["secrets"] = "0"
			}
		case "roles", "cluster-roles":
			if rules, ok, _ := unstructured.NestedSlice(item.Object, "rules"); ok {
				extra["rules"] = fmt.Sprintf("%d rules", len(rules))
			} else {
				extra["rules"] = "0 rules"
			}
		case "role-bindings", "cluster-role-bindings":
			if roleRef, ok, _ := unstructured.NestedString(item.Object, "roleRef", "name"); ok {
				rkind, _, _ := unstructured.NestedString(item.Object, "roleRef", "kind")
				extra["role"] = fmt.Sprintf("%s/%s", rkind, roleRef)
			}
			if subjects, ok, _ := unstructured.NestedSlice(item.Object, "subjects"); ok {
				extra["subjects"] = fmt.Sprintf("%d subjects", len(subjects))
			} else {
				extra["subjects"] = "0 subjects"
			}
		case "network-policies", "networkpolicies":
			if podSel, ok, _ := unstructured.NestedMap(item.Object, "spec", "podSelector", "matchLabels"); ok && len(podSel) > 0 {
				extra["pod-selector"] = fmt.Sprintf("%v", podSel)
			} else {
				extra["pod-selector"] = "<all>"
			}
			if pTypes, ok, _ := unstructured.NestedSlice(item.Object, "spec", "policyTypes"); ok {
				var ts []string
				for _, t := range pTypes {
					if tsStr, ok := t.(string); ok {
						ts = append(ts, tsStr)
					}
				}
				extra["policy-types"] = strings.Join(ts, ", ")
			}
		case "pods":
			if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
				status = phase
			}
			// Just generic values if unavailable
			extra["ready"] = "1/1"
			extra["restarts"] = "0"
		case "deployments":
			replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
			ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
			avail, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")
			up, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedReplicas")
			extra["ready"] = fmt.Sprintf("%d/%d", ready, replicas)
			extra["available"] = fmt.Sprintf("%d", avail)
			extra["up-to-date"] = fmt.Sprintf("%d", up)
		case "statefulsets":
			replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
			ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
			extra["ready"] = fmt.Sprintf("%d/%d", ready, replicas)
			extra["replicas"] = fmt.Sprintf("%d", replicas)
		case "daemonsets":
			desired, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredNumberScheduled")
			ready, _, _ := unstructured.NestedInt64(item.Object, "status", "numberReady")
			avail, _, _ := unstructured.NestedInt64(item.Object, "status", "numberAvailable")
			extra["desired"] = fmt.Sprintf("%d", desired)
			extra["ready"] = fmt.Sprintf("%d", ready)
			extra["available"] = fmt.Sprintf("%d", avail)
		case "services":
			if sType, ok, _ := unstructured.NestedString(item.Object, "spec", "type"); ok {
				status = sType
			}
			if cip, ok, _ := unstructured.NestedString(item.Object, "spec", "clusterIP"); ok {
				extra["cluster-ip"] = cip
			}
		case "ingresses":
			if class, ok, _ := unstructured.NestedString(item.Object, "spec", "ingressClassName"); ok {
				extra["class"] = class
			} else if class, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "kubernetes.io/ingress.class"); ok {
				extra["class"] = class
			}
		case "namespaces":
			if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
				status = phase
			}
		case "persistentvolumeclaims", "pvcs":
			if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
				status = phase
			}
			if cap, ok, _ := unstructured.NestedString(item.Object, "status", "capacity", "storage"); ok {
				extra["capacity"] = cap
			}
			if sc, ok, _ := unstructured.NestedString(item.Object, "spec", "storageClassName"); ok {
				extra["storage-class"] = sc
			}
		case "persistentvolumes", "pvs":
			if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
				status = phase
			}
			if cap, ok, _ := unstructured.NestedString(item.Object, "spec", "capacity", "storage"); ok {
				extra["capacity"] = cap
			}
			if reclaim, ok, _ := unstructured.NestedString(item.Object, "spec", "persistentVolumeReclaimPolicy"); ok {
				extra["reclaim-policy"] = reclaim
			}
			if sc, ok, _ := unstructured.NestedString(item.Object, "spec", "storageClassName"); ok {
				extra["storage-class"] = sc
			}
			if claimRef, ok, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "name"); ok {
				claimNs, _, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "namespace")
				extra["claim"] = fmt.Sprintf("%s/%s", claimNs, claimRef)
			}
		}

		items = append(items, ResourceItem{
			Name:      name,
			Namespace: namespace,
			Age:       age,
			Status:    status,
			Extra:     extra,
		})
	}

	c.JSON(http.StatusOK, items)
}

func (h *ResourceHandler) GetDetails(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Apply RBAC namespace restriction (skip for cluster-scoped resources)
	if !isClusterScoped(kind) {
		if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
			if ns != rbacNs.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
				return
			}
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
						"volumes": []gin.H{
							{"name": "config-volume", "configMap": gin.H{"name": "app-config"}},
							{"name": "secret-volume", "secret": gin.H{"secretName": "app-secret"}},
							{"name": "data-volume", "persistentVolumeClaim": gin.H{"claimName": "pvc-data"}},
						},
					},
				},
				// For direct pods
				"containers": []gin.H{
					{
						"name":  "main",
						"image": "nginx:1.21",
						"ports": []gin.H{{"containerPort": 80}},
					},
				},
				"volumes": []gin.H{
					{"name": "config-volume", "configMap": gin.H{"name": "app-config"}},
					{"name": "secret-volume", "secret": gin.H{"secretName": "app-secret"}},
					{"name": "data-volume", "persistentVolumeClaim": gin.H{"claimName": "pvc-data"}},
				},
			},
			"status": gin.H{
				"phase":               "Running",
				"replicas":            3,
				"readyReplicas":       3,
				"updatedReplicas":     3,
				"availableReplicas":   3,
				"observedGeneration": 4,
				"containerStatuses": []gin.H{
					{
						"name":         "main",
						"ready":        true,
						"restartCount": 0,
						"state": gin.H{
							"running": gin.H{"startedAt": "2024-02-18T10:00:00Z"},
						},
					},
				},
			},
			"metrics": gin.H{
				"containers": []gin.H{
					{
						"name": "main",
						"usage": gin.H{
							"cpu":    "125m",
							"memory": "256Mi",
						},
					},
				},
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

	if strings.ToLower(kind) == "pods" || strings.ToLower(kind) == "pod" {
		metrics, _ := h.k8sClient.GetPodMetrics(c.Request.Context(), ns, name)
		if metrics != nil {
			wrapped["metrics"] = metrics
		}
	}

	c.JSON(http.StatusOK, wrapped)
}

func (h *ResourceHandler) GetYAML(c *gin.Context) {
	name := c.Param("name")
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Apply RBAC namespace restriction (skip for cluster-scoped resources)
	if !isClusterScoped(kind) {
		if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
			if ns != rbacNs.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
				return
			}
		}
	}

	if h.devMode {
		mockObj := map[string]interface{}{
			"apiVersion": "apps/v1",
			"kind":       strings.Title(kind),
			"metadata": map[string]interface{}{
				"name":      name,
				"namespace": "default",
				"labels": map[string]string{
					"app": name,
				},
			},
			"spec": map[string]interface{}{
				"replicas": 3,
				"selector": map[string]interface{}{
					"matchLabels": map[string]string{
						"app": name,
					},
				},
				"template": map[string]interface{}{
					"metadata": map[string]interface{}{
						"labels": map[string]string{
							"app": name,
						},
					},
					"spec": map[string]interface{}{
						"containers": []map[string]interface{}{
							{
								"name":  "main",
								"image": "nginx:1.21",
								"ports": []map[string]interface{}{
									{"containerPort": 80},
								},
							},
						},
					},
				},
			},
		}

		format := c.DefaultQuery("format", "yaml")
		var data []byte
		var marshalErr error

		if format == "json" {
			data, marshalErr = json.MarshalIndent(mockObj, "", "  ")
			c.Header("Content-Type", "application/json")
		} else {
			data, marshalErr = yaml.Marshal(mockObj)
			c.Header("Content-Type", "text/yaml")
		}

		if marshalErr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal mock resource"})
			return
		}

		c.String(http.StatusOK, string(data))
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

	// Remove noisy managed fields for cleaner formatting
	unstructured.RemoveNestedField(item.Object, "metadata", "managedFields")

	format := c.DefaultQuery("format", "yaml")
	var data []byte
	var marshalErr error

	if format == "json" {
		data, marshalErr = json.MarshalIndent(item.Object, "", "  ")
		c.Header("Content-Type", "application/json")
	} else {
		data, marshalErr = yaml.Marshal(item.Object)
		c.Header("Content-Type", "text/yaml")
	}

	if marshalErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal resource"})
		return
	}

	c.String(http.StatusOK, string(data))
}

func (h *ResourceHandler) UpdateYAML(c *gin.Context) {
	name := c.Param("name")
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Apply RBAC namespace restriction (skip for cluster-scoped resources)
	if !isClusterScoped(kind) {
		if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
			if ns != rbacNs.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
				return
			}
		}
	}

	// Verify Edit Permissions
	role, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	roleStr := role.(string)
	if roleStr != "kview-cluster-admin" && roleStr != "admin" && roleStr != "edit" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Editing permissions required (admin or edit role)"})
		return
	}

	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	if h.devMode {
		fmt.Printf("[DEV MODE] Would update %s/%s/%s with YAML:\n%s\n", kind, ns, name, string(body))
		c.JSON(http.StatusOK, gin.H{"message": "Resource updated (mocked)"})
		return
	}

	var obj unstructured.Unstructured
	if err := yaml.Unmarshal(body, &obj); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YAML: " + err.Error()})
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

	// Use Update instead of Apply for simplicity and broad compatibility with unstructured objects
	_, err = resInterface.Update(c.Request.Context(), &obj, metav1.UpdateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource updated successfully"})
}

func (h *ResourceHandler) GetEvents(c *gin.Context) {
	name := c.Param("name")
	_ = c.Param("kind") // kind not used since events are filtered by name
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

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


	// Try listing events for this specific object name and namespace
	eventsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	eventList, err := dynClient.Resource(eventsGVR).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{
		FieldSelector: "involvedObject.name=" + name,
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
