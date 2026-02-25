package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"
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
	mu            sync.Mutex
	cpuHistory    []MetricHistory
	ramHistory    []MetricHistory
	mockResources map[string][]ResourceItem
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{
		devMode:       devMode,
		k8sClient:     k8sClient,
		mockResources: make(map[string][]ResourceItem),
	}
}

// getGVR maps frontend URL :kind parameters to K8s schema.GroupVersionResource
func getGVR(kind string) schema.GroupVersionResource {
	var gvr schema.GroupVersionResource
	switch strings.ToLower(kind) {
	case "pods":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	case "deployments":
		gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	case "services":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}
	case "configmaps":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}
	case "secrets":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}
	case "ingresses":
		gvr = schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
	case "ingress-classes":
		gvr = schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
	case "statefulsets":
		gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
	case "daemonsets":
		gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
	case "replicasets", "replicaset":
		gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}
	case "replicationcontrollers", "replicationcontroller":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "replicationcontrollers"}
	case "jobs":
		gvr = schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
	case "cronjobs":
		gvr = schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	case "namespaces":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}
	case "events":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	case "nodes":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "nodes"}
	case "pvs":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
	case "pvcs":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
	case "storage-classes":
		gvr = schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
	case "crds":
		gvr = schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	case "cluster-roles":
		gvr = schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	case "cluster-role-bindings":
		gvr = schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	case "roles":
		gvr = schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	case "role-bindings":
		gvr = schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	case "serviceaccounts", "service-accounts":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
	case "hpas", "hpa", "horizontalpodautoscalers":
		gvr = schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
	case "vpas", "vpa", "verticalpodautoscalers":
		gvr = schema.GroupVersionResource{Group: "autoscaling.k8s.io", Version: "v1", Resource: "verticalpodautoscalers"}
	case "pdbs", "pdb", "poddisruptionbudgets":
		gvr = schema.GroupVersionResource{Group: "policy", Version: "v1", Resource: "poddisruptionbudgets"}
	case "networkpolicies", "network-policies":
		gvr = schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
	case "endpoints":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	case "resourcequotas", "resource-quotas":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "resourcequotas"}
	case "limitranges", "limit-ranges":
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: "limitranges"}
	default:
		// Attempt a best-effort guess for unknown kinds
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: kind}
	}
	fmt.Printf("[getGVR] Resolved %s -> %v\n", kind, gvr)
	return gvr
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
	NodeCountReady int             `json:"nodeCountReady"`
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
			NodeCountReady: 7,
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
	readyNodes := 0
	for _, n := range nodes {
		cpuTotalInt += n.Status.Capacity.Cpu().Value()
		ramTotalInt += n.Status.Capacity.Memory().Value() / (1024 * 1024 * 1024)

		// Check if node is ready
		for _, cond := range n.Status.Conditions {
			if cond.Type == corev1.NodeReady && cond.Status == corev1.ConditionTrue {
				readyNodes++
				break
			}
		}
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
		NodeCountReady: readyNodes,
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
		items := h.mockResourceList(kind, ns)
		c.JSON(http.StatusOK, items)
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	fmt.Printf("[List] Fetching %s (ns: %s, GVR: %v)\n", kind, ns, gvr)
	
	var listInterface dynamic.ResourceInterface
	if ns != "" && !isClusterScoped(kind) {
		listInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		listInterface = dynClient.Resource(gvr)
	}

	unstructuredList, err := listInterface.List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		fmt.Printf("[List] Error listing %s: %v\n", kind, err)
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
		if len(item.GetOwnerReferences()) > 0 {
			extra["owner-uid"] = string(item.GetOwnerReferences()[0].UID)
		}
		
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
			node, _, _ := unstructured.NestedString(item.Object, "spec", "nodeName")
			extra["node"] = node
			extra["ready"] = "1/1"
			extra["restarts"] = "0"
			extra["cpu"] = "15m"
			extra["ram"] = "32Mi"
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
			extra["pods"] = fmt.Sprintf("%d/%d", ready, desired)

			// Images
			if containers, ok, _ := unstructured.NestedSlice(item.Object, "spec", "template", "spec", "containers"); ok {
				var images []string
				for _, c := range containers {
					if container, ok := c.(map[string]interface{}); ok {
						if img, ok := container["image"].(string); ok {
							images = append(images, img)
						}
					}
				}
				extra["images"] = strings.Join(images, ", ")
			}
			// Labels
			if labels, ok, _ := unstructured.NestedMap(item.Object, "metadata", "labels"); ok {
				var ls []string
				for k, v := range labels {
					if vs, ok := v.(string); ok {
						ls = append(ls, fmt.Sprintf("%s=%s", k, vs))
					}
				}
				extra["labels"] = strings.Join(ls, ", ")
			}
		case "replicasets", "replicationcontrollers":
			replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
			ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
			avail, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")
			extra["desired"] = fmt.Sprintf("%d", replicas)
			extra["current"] = fmt.Sprintf("%d", replicas) // Simplified
			extra["ready"] = fmt.Sprintf("%d", ready)
			if avail > 0 {
				extra["available"] = fmt.Sprintf("%d", avail)
			}
		case "services":
			if sType, ok, _ := unstructured.NestedString(item.Object, "spec", "type"); ok {
				status = sType
			}
			if cip, ok, _ := unstructured.NestedString(item.Object, "spec", "clusterIP"); ok {
				extra["cluster-ip"] = cip
			}
			extra["endpoints"] = "10.244.1.5:8080"
			extra["external"] = "—"
			if labels, ok, _ := unstructured.NestedMap(item.Object, "metadata", "labels"); ok {
				var ls []string
				for k, v := range labels {
					ls = append(ls, fmt.Sprintf("%s=%s", k, v))
				}
				extra["labels"] = strings.Join(ls, ", ")
			}
		case "events":
			if eType, ok, _ := unstructured.NestedString(item.Object, "type"); ok {
				extra["type"] = eType
				if eType == "Warning" {
					status = "Warning"
				}
			}
			if reason, ok, _ := unstructured.NestedString(item.Object, "reason"); ok {
				extra["reason"] = reason
			}
			if message, ok, _ := unstructured.NestedString(item.Object, "message"); ok {
				extra["message"] = message
			}
			kind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
			name, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")
			extra["object"] = fmt.Sprintf("%s/%s", kind, name)
			
			lastSeen := ""
			if ls, ok, _ := unstructured.NestedString(item.Object, "lastTimestamp"); ok && ls != "" {
				if t, err := time.Parse(time.RFC3339, ls); err == nil {
					lastSeen = getAge(t)
				}
			} else if es, ok, _ := unstructured.NestedString(item.Object, "eventTime"); ok && es != "" {
				if t, err := time.Parse(time.RFC3339, es); err == nil {
					lastSeen = getAge(t)
				}
			}
			if lastSeen != "" {
				extra["last-seen"] = lastSeen
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
		case "cronjobs":
			if schedule, ok, _ := unstructured.NestedString(item.Object, "spec", "schedule"); ok {
				extra["schedule"] = schedule
				// Calculate next run
				parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
				if sched, err := parser.Parse(schedule); err == nil {
					next := sched.Next(time.Now())
					extra["next-run"] = next.Format("15:04:05 (02.01)")
				}
			}
			if suspend, ok, _ := unstructured.NestedBool(item.Object, "spec", "suspend"); ok {
				extra["suspend"] = fmt.Sprintf("%v", suspend)
				if suspend {
					status = "Suspended"
				}
			}
			if lastSchedule, ok, _ := unstructured.NestedString(item.Object, "status", "lastScheduleTime"); ok && lastSchedule != "" {
				if t, err := time.Parse(time.RFC3339, lastSchedule); err == nil {
					extra["last-schedule"] = getAge(t) + " ago"
				}
			}
			if active, ok, _ := unstructured.NestedSlice(item.Object, "status", "active"); ok {
				extra["active"] = fmt.Sprintf("%d", len(active))
			} else {
				extra["active"] = "0"
			}
			if containers, ok, _ := unstructured.NestedSlice(item.Object, "spec", "jobTemplate", "spec", "template", "spec", "containers"); ok {
				var images []string
				for _, c := range containers {
					if container, ok := c.(map[string]interface{}); ok {
						if img, ok := container["image"].(string); ok {
							images = append(images, img)
						}
					}
				}
				extra["images"] = strings.Join(images, ", ")
			}
			if labels, ok, _ := unstructured.NestedMap(item.Object, "metadata", "labels"); ok {
				var ls []string
				for k, v := range labels {
					if vs, ok := v.(string); ok {
						ls = append(ls, fmt.Sprintf("%s=%s", k, vs))
					}
				}
				extra["labels"] = strings.Join(ls, ", ")
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
		items := h.mockResourceList(kind, ns)
		var found *ResourceItem
		for _, it := range items {
			if it.Name == name {
				found = &it
				break
			}
		}

		if found == nil {
			// Create a generic fallback mock so detail views don't break in dev mode
			found = &ResourceItem{
				Name:      name,
				Namespace: ns,
				Age:       "1h",
				Status:    "Active",
			}
		}

		revision := "4"
		if r, ok := found.Extra["revision"]; ok {
			revision = r
		}

		                		isDeployment := strings.ToLower(kind) == "deployments" || strings.ToLower(kind) == "deployment"
		                		isDaemonSet := strings.ToLower(kind) == "daemonsets" || strings.ToLower(kind) == "daemonset"
		                		isJob := strings.ToLower(kind) == "jobs" || strings.ToLower(kind) == "job"
		                		isPod := strings.ToLower(kind) == "pods" || strings.ToLower(kind) == "pod"
		                
		                		statusObj := gin.H{
		                			"phase":              "Running",
		                			"observedGeneration": 4,
		                			"conditions": []gin.H{
		                				{
		                					"type":               "Ready",
		                					"status":             "True",
		                					"lastTransitionTime": "2024-02-18T10:00:00Z",
		                					"reason":             "PodReady",
		                					"message":            "Resource is healthy",
		                				},
		                			},
		                		}
		                
		                		specObj := gin.H{
		                			"nodeName":             "worker-01",
		                			"replicas":             3,
		                			"minReadySeconds":      0,
		                			"revisionHistoryLimit": 10,
		                			"strategy": gin.H{
		                				"type": "RollingUpdate",
		                				"rollingUpdate": gin.H{
		                					"maxSurge":       "25%",
		                					"maxUnavailable": "25%",
		                				},
		                			},
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
		                		}
		                
		                		metadataObj := gin.H{
		                			"name":              found.Name,
		                			"namespace":         found.Namespace,
		                			"uid":               "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
		                			"creationTimestamp": "2024-02-18T10:00:00Z",
		                			"labels":            gin.H{"app": found.Name, "env": "prod", "version": "1.2.0"},
		                			"annotations":       gin.H{"kview.io/managed-by": "k-view", "deployment.kubernetes.io/revision": revision},
		                		}
		                
		                		if isDeployment {
		                			statusObj["replicas"] = 3
		                			statusObj["readyReplicas"] = 3
		                			statusObj["updatedReplicas"] = 3
		                			statusObj["availableReplicas"] = 3
		                		}
		                
		                		if isDaemonSet {
		                			statusObj["numberReady"] = 7
		                			statusObj["desiredNumberScheduled"] = 7
		                			statusObj["numberAvailable"] = 7
		                			statusObj["currentNumberScheduled"] = 7
		                		}
		                
		                		if isJob {
		                			statusObj["succeeded"] = 1
		                			statusObj["active"] = 0
		                			specObj["completions"] = 1
		                			specObj["parallelism"] = 1
		                		}
		                
		                		if isPod {
		                			metadataObj["ownerReferences"] = []gin.H{
		                				{
		                					"apiVersion": "apps/v1",
		                					"kind":       "ReplicaSet",
		                					"name":       found.Name + "-hash123",
		                					"uid":        "rs-uid-456",
		                				},
		                			}
		                			specObj["volumes"] = []gin.H{
		                				{
		                					"name": "data-storage",
		                					"persistentVolumeClaim": gin.H{
		                						"claimName": "postgres-data-pvc",
		                					},
		                				},
		                			}
		                			specObj["containers"] = []gin.H{
		                				{
		                					"name":  "main",
		                					"image": "nginx:1.21",
		                					"ports": []gin.H{{"containerPort": 80}},
		                					"env": []gin.H{
		                						{"name": "DB_HOST", "value": "postgres-svc"},
		                						{"name": "API_KEY", "valueFrom": gin.H{"secretKeyRef": gin.H{"name": "api-secret", "key": "key"}}},
		                					},
		                					"volumeMounts": []gin.H{
		                						{"name": "data-storage", "mountPath": "/var/lib/data", "readOnly": false},
		                					},
		                					"livenessProbe": gin.H{
		                						"httpGet":             gin.H{"path": "/healthz", "port": 80},
		                						"initialDelaySeconds": 15,
		                						"timeoutSeconds":      1,
		                						"periodSeconds":       10,
		                						"successThreshold":    1,
		                						"failureThreshold":    3,
		                					},
		                					"readinessProbe": gin.H{
		                						"httpGet":             gin.H{"path": "/ready", "port": 80},
		                						"initialDelaySeconds": 5,
		                						"timeoutSeconds":      1,
		                						"periodSeconds":       10,
		                						"successThreshold":    1,
		                						"failureThreshold":    3,
		                					},
		                				},
		                			}
		                			statusObj["containerStatuses"] = []gin.H{
		                				{
		                					"name":         "main",
		                					"ready":        true,
		                					"started":      true,
		                					"restartCount": 0,
		                					"state": gin.H{
		                						"running": gin.H{"startedAt": "2024-02-18T10:00:05Z"},
		                					},
		                				},
		                			}
		                		}
		                
		                		details := gin.H{
		                			"resource": found,
		                			"metadata": metadataObj,
		                			"spec":     specObj,
		                			"status":   statusObj,
		                			"metrics": gin.H{				"containers": []gin.H{
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

		if isDeployment {
			details["newReplicaSet"] = gin.H{
				"metadata": gin.H{
					"name":      found.Name + "-hash123",
					"namespace": found.Namespace,
					"uid":       "rs-uid-456",
				},
			}
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
		// Use provided namespace or default for mock
		mockNs := ns
		if mockNs == "" {
			mockNs = "default"
		}

		mockObj := map[string]interface{}{
			"apiVersion": "apps/v1",
			"kind":       strings.Title(kind),
			"metadata": map[string]interface{}{
				"name":      name,
				"namespace": mockNs,
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

		// Adjust mock for non-workload types
		if strings.Contains(kind, "service") {
			mockObj["apiVersion"] = "v1"
			mockObj["kind"] = "Service"
			delete(mockObj, "spec")
			mockObj["spec"] = map[string]interface{}{
				"ports": []map[string]interface{}{
					{"port": 80, "targetPort": 80, "protocol": "TCP"},
				},
				"selector": map[string]interface{}{"app": name},
			}
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
		fmt.Printf("[DEV MODE] Update %s/%s/%s with YAML:\n%s\n", kind, ns, name, string(body))
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Mock %s '%s' updated in namespace '%s'", kind, name, ns)})
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
	fmt.Printf("[UpdateYAML] Attempting to update %s %s in namespace %s\n", kind, name, ns)
	_, err = resInterface.Update(c.Request.Context(), &obj, metav1.UpdateOptions{})
	if err != nil {
		fmt.Printf("[UpdateYAML] Error updating %s %s: %v\n", kind, name, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update resource: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource updated successfully"})
}

func (h *ResourceHandler) Delete(c *gin.Context) {
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
		h.mu.Lock()
		if list, ok := h.mockResources[kind]; ok {
			var newList []ResourceItem
			for _, item := range list {
				if item.Name != name || (ns != "" && item.Namespace != ns) {
					newList = append(newList, item)
				}
			}
			h.mockResources[kind] = newList
		}
		h.mu.Unlock()
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Mock %s '%s' deleted from namespace '%s'", kind, name, ns)})
		return
	}

	force := c.Query("force") == "true"
	gracePeriod := int64(30)
	if force {
		gracePeriod = 0
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	var dc dynamic.ResourceInterface
	if ns != "" {
		dc = dynClient.Resource(gvr).Namespace(ns)
	} else {
		dc = dynClient.Resource(gvr)
	}

	err = dc.Delete(c.Request.Context(), name, metav1.DeleteOptions{
		GracePeriodSeconds: &gracePeriod,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete resource: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Resource deleted"})
}

func (h *ResourceHandler) Create(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Apply RBAC namespace restriction (skip for cluster-scoped resources)
	if !isClusterScoped(kind) {
		if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
			// If creating in a namespace, it must match or be empty (if they can create in any)
			// But usually, they should be restricted to their allowed namespace.
			if ns != "" && ns != rbacNs.(string) {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + ns})
				return
			}
			// If ns is empty from URL, use the one from RBAC
			if ns == "" {
				ns = rbacNs.(string)
			}
		}
	}

	// Verify Edit/Create Permissions
	role, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	roleStr := role.(string)
	if roleStr != "kview-cluster-admin" && roleStr != "admin" && roleStr != "edit" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Creation permissions required (admin or edit role)"})
		return
	}

	body, err := c.GetRawData()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	if h.devMode {
		var obj unstructured.Unstructured
		if err := yaml.Unmarshal(body, &obj); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YAML/JSON: " + err.Error()})
			return
		}
		if ns != "" {
			obj.SetNamespace(ns)
		}

		h.mu.Lock()
		if h.mockResources == nil {
			h.mockResources = make(map[string][]ResourceItem)
		}
		name := obj.GetName()
		if name == "" {
			name = "mock-resource-" + fmt.Sprintf("%d", time.Now().Unix())
		}
		h.mockResources[kind] = append(h.mockResources[kind], ResourceItem{
			Name:      name,
			Namespace: obj.GetNamespace(),
			Age:       "0s",
			Status:    "Created",
		})
		h.mu.Unlock()

		fmt.Printf("[DEV MODE] Created mock %s in namespace %s: %s\n", kind, ns, name)
		c.JSON(http.StatusCreated, gin.H{"message": "Resource created (mocked)", "name": name})
		return
	}

	var obj unstructured.Unstructured
	// Handle both YAML and JSON
	if err := yaml.Unmarshal(body, &obj); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YAML/JSON: " + err.Error()})
		return
	}

	// Ensure namespace matches URL if provided in YAML
	if ns != "" {
		obj.SetNamespace(ns)
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client: " + err.Error()})
		return
	}

	gvr := getGVR(kind)
	var resInterface dynamic.ResourceInterface
	if obj.GetNamespace() != "" {
		resInterface = dynClient.Resource(gvr).Namespace(obj.GetNamespace())
	} else {
		resInterface = dynClient.Resource(gvr)
	}

	fmt.Printf("[Create] Attempting to create %s %s in namespace %s\n", kind, obj.GetName(), obj.GetNamespace())
	created, err := resInterface.Create(c.Request.Context(), &obj, metav1.CreateOptions{})
	if err != nil {
		fmt.Printf("[Create] Error creating %s %s: %v\n", kind, obj.GetName(), err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create resource: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Resource created successfully",
		"name":    created.GetName(),
	})
}

func (h *ResourceHandler) Restart(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Verify Edit Permissions
	role, _ := c.Get("role")
	if role.(string) != "kview-cluster-admin" && role.(string) != "admin" && role.(string) != "edit" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin/Edit permissions required"})
		return
	}

	if h.devMode {
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Restart triggered for mock %s '%s' in namespace '%s'", kind, name, ns)})
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Client failed"})
		return
	}

	gvr := getGVR(kind)
	var dc dynamic.ResourceInterface
	if ns != "" {
		dc = dynClient.Resource(gvr).Namespace(ns)
	} else {
		dc = dynClient.Resource(gvr)
	}

	// Pods are "restarted" by being deleted
	if kind == "pods" || kind == "pod" {
		err = dc.Delete(c.Request.Context(), name, metav1.DeleteOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Pod deletion triggered (restart)"})
		return
	}

	// For Deployments, StatefulSets, DaemonSets - update annotation
	obj, err := dc.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fetch failed: " + err.Error()})
		return
	}

	// Patch restartedAt annotation
	t := time.Now().Format(time.RFC3339)
	unstructured.SetNestedField(obj.Object, t, "spec", "template", "metadata", "annotations", "kview.io/restartedAt")

	_, err = dc.Update(c.Request.Context(), obj, metav1.UpdateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Restart failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Rollout restart triggered"})
}

func (h *ResourceHandler) Scale(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	var input struct {
		Replicas int64 `json:"replicas"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Verify Edit Permissions
	role, _ := c.Get("role")
	if role.(string) != "kview-cluster-admin" && role.(string) != "admin" && role.(string) != "edit" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin/Edit permissions required"})
		return
	}

	if h.devMode {
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Scaled to %d (mocked)", input.Replicas)})
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Client failed"})
		return
	}

	gvr := getGVR(kind)
	var dc dynamic.ResourceInterface
	if ns != "" {
		dc = dynClient.Resource(gvr).Namespace(ns)
	} else {
		dc = dynClient.Resource(gvr)
	}

	obj, err := dc.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fetch failed"})
		return
	}

	unstructured.SetNestedField(obj.Object, input.Replicas, "spec", "replicas")

	_, err = dc.Update(c.Request.Context(), obj, metav1.UpdateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Scale failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Scale updated"})
}

func (h *ResourceHandler) Trigger(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Trigger only supported for CronJobs
	if kind != "cronjobs" && kind != "cronjob" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Trigger only supported for CronJobs"})
		return
	}

	// Verify Edit Permissions
	role, _ := c.Get("role")
	if role.(string) != "kview-cluster-admin" && role.(string) != "admin" && role.(string) != "edit" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin/Edit permissions required"})
		return
	}

	if h.devMode {
		h.mu.Lock()
		if h.mockResources == nil {
			h.mockResources = make(map[string][]ResourceItem)
		}
		jobName := fmt.Sprintf("%s-manual-%d", name, time.Now().Unix())
		newJob := ResourceItem{
			Name:      jobName,
			Namespace: ns,
			Age:       "0s",
			Status:    "Active",
			Extra: ex(
				"completions", "0 succeeded, 0 failed, 1 active",
				"duration", "1s",
				"owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
				"images", "mock-image:latest",
				"labels", "triggered-by=manual",
			),
		}
		h.mockResources["jobs"] = append(h.mockResources["jobs"], newJob)
		h.mu.Unlock()

		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("CronJob %s triggered (mocked)", name), "jobName": jobName})
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Client failed"})
		return
	}

	// Get CronJob
	gvr := getGVR("cronjobs")
	var dc dynamic.ResourceInterface
	if ns != "" {
		dc = dynClient.Resource(gvr).Namespace(ns)
	} else {
		dc = dynClient.Resource(gvr)
	}

	cronJob, err := dc.Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Fetch CronJob failed: " + err.Error()})
		return
	}

	// Extract jobTemplate
	jobTemplate, ok, _ := unstructured.NestedMap(cronJob.Object, "spec", "jobTemplate")
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid CronJob: missing jobTemplate"})
		return
	}

	// Create Job object
	jobName := fmt.Sprintf("%s-manual-%d", name, time.Now().Unix())
	if len(jobName) > 63 {
		jobName = jobName[0:50] + "-" + fmt.Sprintf("%d", time.Now().Unix())
	}

	job := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "batch/v1",
			"kind":       "Job",
			"metadata": map[string]interface{}{
				"name":      jobName,
				"namespace": ns,
				"annotations": map[string]string{
					"cronjob.kubernetes.io/instantiate": "manual",
				},
				"ownerReferences": []map[string]interface{}{
					{
						"apiVersion": cronJob.GetAPIVersion(),
						"kind":       cronJob.GetKind(),
						"name":       cronJob.GetName(),
						"uid":        cronJob.GetUID(),
					},
				},
			},
			"spec": jobTemplate["spec"],
		},
	}

	// Submit Job
	jobGVR := getGVR("jobs")
	var jobInterface dynamic.ResourceInterface
	if ns != "" {
		jobInterface = dynClient.Resource(jobGVR).Namespace(ns)
	} else {
		jobInterface = dynClient.Resource(jobGVR)
	}

	_, err = jobInterface.Create(c.Request.Context(), job, metav1.CreateOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Job: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "CronJob triggered successfully", "jobName": jobName})
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
		
		count, _, _ := unstructured.NestedInt64(e.Object, "count")
		sourceComp, _, _ := unstructured.NestedString(e.Object, "source", "component")
		sourceHost, _, _ := unstructured.NestedString(e.Object, "source", "host")
		source := sourceComp
		if sourceHost != "" {
			if source != "" {
				source += " "
			}
			source += sourceHost
		}

		invName, _, _ := unstructured.NestedString(e.Object, "involvedObject", "name")
		subObject, _, _ := unstructured.NestedString(e.Object, "involvedObject", "fieldPath")

		firstTimestamp, okF, _ := unstructured.NestedString(e.Object, "firstTimestamp")
		firstSeen := "Unknown"
		if okF && firstTimestamp != "" {
			if ft, err := time.Parse(time.RFC3339, firstTimestamp); err == nil {
				firstSeen = getAge(ft)
			}
		}

		lastTimestamp, okL, _ := unstructured.NestedString(e.Object, "lastTimestamp")
		lastSeen := "Unknown"
		if okL && lastTimestamp != "" {
			if lt, err := time.Parse(time.RFC3339, lastTimestamp); err == nil {
				lastSeen = getAge(lt)
			}
		}

		if firstSeen == "Unknown" {
			if eventTime, ok, _ := unstructured.NestedString(e.Object, "eventTime"); ok && eventTime != "" {
				if et, err := time.Parse(time.RFC3339Nano, eventTime); err == nil {
					firstSeen = getAge(et)
					lastSeen = getAge(et)
				}
			}
		}

		events = append(events, gin.H{
			"type":      eType,
			"reason":    reason,
			"message":   message,
			"name":      invName,
			"source":    source,
			"subObject": subObject,
			"count":     count,
			"firstSeen": firstSeen,
			"lastSeen":  lastSeen,
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
		// Cluster-scoped resources have empty Namespace and should be shown
		// regardless of the namespace filter.
		if it.Namespace == "" || it.Namespace == ns {
			filtered = append(filtered, it)
		}
	}
	return filtered
}

func (h *ResourceHandler) mockResourceList(kind, ns string) []ResourceItem {
	var items []ResourceItem

	switch kind {
	case "pods":
		items = []ResourceItem{
			{Name: "frontend-web-5d8f7b", Namespace: "default", Age: "19h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-01", "cpu", "12m", "ram", "45Mi", "images", "nginx:1.21", "labels", "app=frontend, tier=web")},
			{Name: "backend-api-6c9f8c", Namespace: "default", Age: "4h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-02", "cpu", "25m", "ram", "128Mi", "images", "node:18-alpine", "labels", "app=backend, tier=api")},
			{Name: "worker-job-abc12", Namespace: "default", Age: "2h", Status: "CrashLoopBackOff", Extra: ex("ready", "0/1", "restarts", "8", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-01", "cpu", "0m", "ram", "8Mi", "images", "busybox:latest", "labels", "job-name=worker-job")},
			{Name: "cache-redis-001", Namespace: "default", Age: "3h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-03", "cpu", "5m", "ram", "256Mi", "images", "redis:7-alpine", "labels", "app=cache")},
			{Name: "auth-service-xyz", Namespace: "auth", Age: "1h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-01", "cpu", "8m", "ram", "64Mi", "images", "kview/auth:v1.2", "labels", "app=auth")},
			{Name: "oauth-proxy-001", Namespace: "auth", Age: "30m", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-02", "cpu", "2m", "ram", "16Mi", "images", "bitnami/oauth2-proxy:7.4.0", "labels", "app=oauth-proxy")},
			{Name: "pgbouncer-main", Namespace: "database", Age: "5h", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-03", "cpu", "4m", "ram", "32Mi", "images", "edoburu/pgbouncer:latest", "labels", "app=pgbouncer")},
			{Name: "postgres-primary-0", Namespace: "database", Age: "2d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-01", "cpu", "15m", "ram", "512Mi", "images", "postgres:15-alpine", "labels", "app=postgres, role=primary")},
			{Name: "postgres-replica-0", Namespace: "database", Age: "2d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-02", "cpu", "10m", "ram", "512Mi", "images", "postgres:15-alpine", "labels", "app=postgres, role=replica")},
			{Name: "kafka-broker-0", Namespace: "messaging", Age: "3d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-03", "cpu", "50m", "ram", "2Gi", "images", "bitnami/kafka:3.4.0", "labels", "app=kafka, kafka-broker-id=0")},
			{Name: "prometheus-0", Namespace: "monitoring", Age: "1d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-01", "cpu", "100m", "ram", "1Gi", "images", "prom/prometheus:v2.45.0", "labels", "app=prometheus")},
			{Name: "alertmanager-0", Namespace: "monitoring", Age: "1h", Status: "CrashLoopBackOff", Extra: ex("ready", "0/1", "restarts", "3", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "worker-02", "cpu", "0m", "ram", "16Mi", "images", "prom/alertmanager:v0.25.0", "labels", "app=alertmanager")},
			{Name: "coredns-5d78c9b4", Namespace: "kube-system", Age: "7d", Status: "Running", Extra: ex("ready", "1/1", "restarts", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "node", "master-01", "cpu", "5m", "ram", "32Mi", "images", "coredns/coredns:1.10.1", "labels", "k8s-app=kube-dns")},
		}

	case "deployments":
		items = []ResourceItem{
			{Name: "frontend-web", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "3/3", "up-to-date", "3", "available", "3", "images", "nginx:1.21, busybox:latest", "labels", "app=frontend, tier=web")},
			{Name: "backend-api", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2", "images", "node:18-alpine", "labels", "app=backend, tier=api")},
			{Name: "cache-redis", Namespace: "default", Age: "30d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1", "images", "redis:7-alpine", "labels", "app=cache, tier=data")},
			{Name: "auth-service", Namespace: "auth", Age: "20d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2", "images", "kview/auth:v1.2", "labels", "app=auth")},
			{Name: "prometheus", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1", "images", "prom/prometheus:v2.45.0", "labels", "app=prometheus")},
			{Name: "grafana", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1", "images", "grafana/grafana:10.0.3", "labels", "app=grafana")},
			{Name: "loki", Namespace: "logging", Age: "28d", Status: "Running", Extra: ex("ready", "1/1", "up-to-date", "1", "available", "1", "images", "grafana/loki:2.8.2", "labels", "app=loki")},
			{Name: "ingress-nginx-controller", Namespace: "ingress-nginx", Age: "30d", Status: "Running", Extra: ex("ready", "2/2", "up-to-date", "2", "available", "2", "images", "k8s.gcr.io/ingress-nginx/controller:v1.8.1", "labels", "app=ingress-nginx")},
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
			{Name: "fluentbit", Namespace: "logging", Age: "28d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7", "pods", "7/7", "images", "fluent/fluent-bit:2.1.0", "labels", "app=fluentbit,tier=logging")},
			{Name: "kube-proxy", Namespace: "kube-system", Age: "30d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7", "pods", "7/7", "images", "registry.k8s.io/kube-proxy:v1.28.2", "labels", "app=kube-proxy,tier=node")},
			{Name: "node-exporter", Namespace: "monitoring", Age: "28d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7", "pods", "7/7", "images", "prom/node-exporter:v1.6.1", "labels", "app=node-exporter,tier=monitoring")},
			{Name: "calico-node", Namespace: "kube-system", Age: "30d", Status: "Running", Extra: ex("desired", "7", "ready", "7", "available", "7", "pods", "7/7", "images", "docker.io/calico/node:v3.26.1", "labels", "app=calico-node,tier=node")},
		}

	case "replicasets":
		items = []ResourceItem{
			{Name: "frontend-web-5d8f7b", Namespace: "default", Age: "19h", Status: "Active", Extra: ex("desired", "3", "current", "3", "ready", "3", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "revision", "4", "images", "nginx:1.21", "labels", "app=frontend,pod-template-hash=5d8f7b")},
			{Name: "frontend-web-old", Namespace: "default", Age: "2d", Status: "Inactive", Extra: ex("desired", "0", "current", "0", "ready", "0", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "revision", "3", "images", "nginx:1.20", "labels", "app=frontend,pod-template-hash=old")},
			{Name: "backend-api-6c9f8c", Namespace: "default", Age: "4h", Status: "Active", Extra: ex("desired", "2", "current", "2", "ready", "2", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "revision", "2", "images", "node:18-alpine", "labels", "app=backend,pod-template-hash=6c9f8c")},
		}

	case "hpas":
		items = []ResourceItem{
			{Name: "frontend-hpa", Namespace: "default", Age: "30d", Status: "Active", Extra: ex("min", "3", "max", "10", "current", "3", "target", "cpu: 80%", "target-name", "frontend-web")},
			{Name: "backend-hpa", Namespace: "default", Age: "30d", Status: "Active", Extra: ex("min", "2", "max", "5", "current", "2", "target", "memory: 1Gi", "target-name", "backend-api")},
		}

	case "replicationcontrollers":
		items = []ResourceItem{
			{Name: "legacy-worker", Namespace: "default", Age: "100d", Status: "Active", Extra: ex("desired", "1", "current", "1", "ready", "1")},
		}

	case "jobs":
		items = []ResourceItem{
			{Name: "db-backup-manual-123", Namespace: "database", Age: "2d", Status: "Complete", Extra: ex("completions", "1 succeeded, 0 failed, 0 active", "duration", "12s", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "images", "postgres:15-alpine", "labels", "app=db, env=prod", "ready", "1/1")},
			{Name: "token-cleanup-manual-456", Namespace: "auth", Age: "1d", Status: "Complete", Extra: ex("completions", "1 succeeded, 0 failed, 0 active", "duration", "45s", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "images", "auth-utils:v2", "labels", "component=auth-cleanup", "ready", "1/1")},
			{Name: "report-generator-manual-789", Namespace: "default", Age: "4h", Status: "Active", Extra: ex("completions", "0 succeeded, 0 failed, 1 active", "duration", "3s", "owner-uid", "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6", "images", "reports-worker:latest", "labels", "tier=frontend", "ready", "0/1")},
		}

	case "cronjobs":
		items = []ResourceItem{
			{Name: "db-backup", Namespace: "database", Age: "25d", Status: "Active", Extra: ex("schedule", "0 2 * * *", "next-run", "02:00:00 (26.02)", "last-schedule", "4h ago", "images", "postgres:15-alpine", "labels", "app=db,env=prod", "suspend", "False", "active", "1")},
			{Name: "token-cleanup", Namespace: "auth", Age: "20d", Status: "Active", Extra: ex("schedule", "0 */6 * * *", "next-run", "06:00:00 (26.02)", "last-schedule", "1h ago", "images", "auth-utils:v2", "labels", "component=auth-cleanup", "suspend", "False", "active", "0")},
			{Name: "report-generator", Namespace: "default", Age: "15d", Status: "Suspended", Extra: ex("schedule", "0 8 * * 1", "next-run", "08:00:00 (02.03)", "last-schedule", "7d ago", "images", "reports-worker:latest", "labels", "tier=frontend", "suspend", "True", "active", "0")},
			{Name: "log-rotate", Namespace: "logging", Age: "28d", Status: "Active", Extra: ex("schedule", "0 0 * * *", "next-run", "00:00:00 (26.02)", "last-schedule", "8h ago", "images", "fluentd:v1.16", "labels", "role=logging", "suspend", "False", "active", "1")},
		}

	case "services":
		items = []ResourceItem{
			{Name: "kubernetes", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.0.1", "ports", "443/TCP", "labels", "component=apiserver,provider=kubernetes", "endpoints", "10.0.0.1:443")},
			{Name: "frontend-svc", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.12.34", "ports", "80/TCP", "labels", "app=frontend", "endpoints", "10.244.1.5:80, 10.244.2.3:80")},
			{Name: "backend-svc", Namespace: "default", Age: "30d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.56.78", "ports", "8080/TCP", "labels", "app=backend", "endpoints", "10.244.1.6:8080")},
			{Name: "postgres-primary", Namespace: "database", Age: "25d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.100.1", "ports", "5432/TCP", "labels", "app=postgres,role=primary", "endpoints", "10.244.1.10:5432")},
			{Name: "kafka-broker", Namespace: "messaging", Age: "20d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.200.1", "ports", "9092/TCP", "labels", "app=kafka", "endpoints", "10.244.3.4:9092")},
			{Name: "prometheus", Namespace: "monitoring", Age: "28d", Status: "ClusterIP", Extra: ex("cluster-ip", "10.96.150.1", "ports", "9090/TCP", "labels", "app=prometheus", "endpoints", "10.244.1.20:9090")},
			{Name: "grafana", Namespace: "monitoring", Age: "28d", Status: "LoadBalancer", Extra: ex("cluster-ip", "10.96.150.2", "ports", "80:3000/TCP", "labels", "app=grafana", "endpoints", "10.244.1.21:3000", "external", "35.190.20.10")},
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

	case "events":
		items = []ResourceItem{
			{Name: "default-token.181a0e", Namespace: "default", Age: "10m", Status: "Normal", Extra: ex("type", "Normal", "reason", "Created", "object", "ServiceAccount/default", "message", "Created service account token", "last-seen", "10m")},
			{Name: "frontend-web.181a1f", Namespace: "default", Age: "5m", Status: "Warning", Extra: ex("type", "Warning", "reason", "BackOff", "object", "Pod/frontend-web-5d8f7b", "message", "Back-off restarting failed container", "last-seen", "1m")},
			{Name: "backend-api.181a2b", Namespace: "default", Age: "15m", Status: "Normal", Extra: ex("type", "Normal", "reason", "Scheduled", "object", "Pod/backend-api-6c9f8c", "message", "Successfully assigned default/backend-api-6c9f8c to node-1", "last-seen", "15m")},
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

	case "resourcequotas", "resource-quotas":
		items = []ResourceItem{
			{Name: "default-quota", Namespace: "default", Age: "30d", Extra: ex("hard", "cpu: 4, memory: 8Gi, pods: 20", "used", "cpu: 1.2, memory: 2Gi, pods: 12")},
			{Name: "db-quota", Namespace: "database", Age: "25d", Extra: ex("hard", "cpu: 8, memory: 16Gi, pods: 10", "used", "cpu: 4, memory: 6Gi, pods: 4")},
			{Name: "compute-quota", Namespace: "messaging", Age: "20d", Extra: ex("hard", "cpu: 16, memory: 32Gi, pods: 50", "used", "cpu: 2, memory: 4Gi, pods: 10")},
		}

	case "limitranges", "limit-ranges":
		items = []ResourceItem{
			{Name: "default-limits", Namespace: "default", Age: "30d", Extra: ex("limits", "Container: cpu 100m-1, mem 128Mi-1Gi")},
			{Name: "db-limits", Namespace: "database", Age: "25d", Extra: ex("limits", "Container: cpu 500m-2, mem 512Mi-4Gi")},
		}
	case "nodes":
		items = []ResourceItem{
			{Name: "master-01", Age: "30d", Status: "Ready", Extra: ex("role", "control-plane", "cpu", "4", "memory", "8Gi")},
			{Name: "worker-01", Age: "20d", Status: "Ready", Extra: ex("role", "worker", "cpu", "8", "memory", "32Gi")},
			{Name: "worker-02", Age: "20d", Status: "Ready", Extra: ex("role", "worker", "cpu", "8", "memory", "32Gi")},
		}
	}

	h.mu.Lock()
	if h.mockResources != nil {
		if dynItems, ok := h.mockResources[kind]; ok {
			items = append(items, dynItems...)
		}
	}
	h.mu.Unlock()

	return filter(items, ns)
}
