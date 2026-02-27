package handlers

import (
	"fmt"
	"net/http"
	"strings"
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

	"k-view/pkg/k8sutils"
	"k-view/pkg/utils"
)

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
		gvr = schema.GroupVersionResource{Group: "", Version: "v1", Resource: kind}
	}
	return gvr
}

func (h *ResourceHandler) GetStats(c *gin.Context) {
	if h.devMode {
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

	ctx := c.Request.Context()
	nodes, err := h.k8sClient.ListNodes(ctx)
	if err != nil {
		c.JSON(http.StatusOK, ClusterStats{ClusterName: "k-cluster (limited access)"})
		return
	}

	pods, _ := h.k8sClient.ListPods(ctx, "")

	var cpuTotalInt, ramTotalInt int64
	readyNodes := 0
	for _, n := range nodes {
		cpuTotalInt += n.Status.Capacity.Cpu().Value()
		ramTotalInt += n.Status.Capacity.Memory().Value() / (1024 * 1024 * 1024)

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

	hasMetrics := false
	var cpuUsage, ramUsage float64
	dynClient, dErr := h.k8sClient.GetDynamicClient(ctx)
	if dErr == nil {
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
		ETCDHealth:     "Healthy",
		MetricsServer:  hasMetrics,
	}

	if len(nodes) > 0 {
		stats.K8sVersion = nodes[0].Status.NodeInfo.KubeletVersion
	}

	if hasMetrics {
		h.mu.Lock()
		now := time.Now().Format("15:04")
		h.cpuHistory = append(h.cpuHistory, MetricHistory{Timestamp: now, Value: cpuUsage})
		h.ramHistory = append(h.ramHistory, MetricHistory{Timestamp: now, Value: ramUsage})
		if len(h.cpuHistory) > 30 {
			h.cpuHistory = h.cpuHistory[len(h.cpuHistory)-30:]
			h.ramHistory = h.ramHistory[len(h.ramHistory)-30:]
		}
		stats.CPUHistory = h.cpuHistory
		stats.RAMHistory = h.ramHistory
		h.mu.Unlock()
	}

	c.JSON(http.StatusOK, stats)
}

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")
	if ns == "-" { ns = "" }

	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		ns = rbacNs.(string)
	}

	var unstructuredItems []unstructured.Unstructured
	var endpointsMap = make(map[string]string)

	if h.devMode {
		unstructuredItems = h.mockRawResourceList(kind, ns)
		if unstructuredItems == nil {
			// Fallback to legacy mock list if new raw format is not found
			c.JSON(http.StatusOK, h.mockResourceList(kind, ns))
			return
		}
		// In DEV_MODE we can also load endpoints mock if kind is services
		if kind == "services" {
			epsRaw := h.mockRawResourceList("endpoints", ns)
			for _, ep := range epsRaw {
				endpointsMap[ep.GetNamespace()+"/"+ep.GetName()] = "10.0.0.1:80, 10.0.0.2:80 (mock)"
			}
		}
	} else {
		dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
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
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		unstructuredItems = unstructuredList.Items

		if kind == "services" {
			epsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
			epsList, _ := dynClient.Resource(epsGVR).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
			if epsList != nil {
				for _, ep := range epsList.Items {
					var addrStrs []string
					if subsets, ok, _ := unstructured.NestedSlice(ep.Object, "subsets"); ok {
						for _, s := range subsets {
							subset := s.(map[string]interface{})
							addrs, _, _ := unstructured.NestedSlice(subset, "addresses")
							ports, _, _ := unstructured.NestedSlice(subset, "ports")
							for _, a := range addrs {
								addr := a.(map[string]interface{})
								ip := addr["ip"].(string)
								for _, p := range ports {
									port := p.(map[string]interface{})
									pNum, _, _ := unstructured.NestedInt64(port, "port")
									addrStrs = append(addrStrs, fmt.Sprintf("%s:%d", ip, pNum))
								}
							}
						}
					}
					endpointsMap[ep.GetNamespace()+"/"+ep.GetName()] = strings.Join(addrStrs, ", ")
				}
			}
		}
	}

	var items []ResourceItem
	for _, item := range unstructuredItems {
		name := item.GetName()
		namespace := item.GetNamespace()
		age := utils.GetAge(item.GetCreationTimestamp().Time)
		
		status := "Active"
		if statusMap, ok := item.Object["status"].(map[string]interface{}); ok {
			if phase, ok := statusMap["phase"].(string); ok {
				status = phase
			} else if conditions, ok := statusMap["conditions"].([]interface{}); ok && len(conditions) > 0 {
				if condMap, ok := conditions[len(conditions)-1].(map[string]interface{}); ok {
					if condType, ok := condMap["type"].(string); ok { status = condType }
				}
			}
		}

		extra := map[string]string{"kind": item.GetKind()}
		if len(item.GetOwnerReferences()) > 0 {
			extra["owner-uid"] = string(item.GetOwnerReferences()[0].UID)
		}

		resItem := ResourceItem{
			Name:      name,
			Namespace: namespace,
			Age:       age,
			Status:    status,
			Extra:     extra,
		}

		h.mapWorkload(item, kind, extra, &resItem)
		h.mapNetwork(item, kind, extra, &resItem, endpointsMap)
		h.mapStorage(item, kind, extra, &resItem)
		h.mapRBAC(item, kind, extra, &resItem)
		status = resItem.Status

		switch kind {
		case "configmaps", "secrets":
			if data, ok, _ := unstructured.NestedMap(item.Object, "data"); ok {
				extra["data"] = fmt.Sprintf("%d", len(data))
				resItem.Data = data
			}
			extra["labels"] = k8sutils.GetLabels(item.Object)
		case "namespaces":
			extra["labels"] = k8sutils.GetLabels(item.Object)
		case "cronjobs":
			if schedule, ok, _ := unstructured.NestedString(item.Object, "spec", "schedule"); ok {
				extra["schedule"] = schedule
				parser := cron.NewParser(cron.Minute | cron.Hour | cron.Dom | cron.Month | cron.Dow | cron.Descriptor)
				if sched, err := parser.Parse(schedule); err == nil {
					extra["next-run"] = sched.Next(time.Now()).Format("15:04:05 (02.01)")
				}
			}
			if suspend, ok, _ := unstructured.NestedBool(item.Object, "spec", "suspend"); ok {
				extra["suspend"] = fmt.Sprintf("%v", suspend)
			} else {
				extra["suspend"] = "false"
			}
			if active, ok, _ := unstructured.NestedSlice(item.Object, "status", "active"); ok {
				extra["active"] = fmt.Sprintf("%d", len(active))
			} else {
				extra["active"] = "0"
			}
			if lastRun, ok, _ := unstructured.NestedString(item.Object, "status", "lastScheduleTime"); ok {
				extra["last-schedule"] = utils.GetAge(k8sutils.ParseK8sTime(lastRun))
			} else {
				extra["last-schedule"] = "—"
			}
			extra["images"] = k8sutils.GetImages(item.Object)
			extra["labels"] = k8sutils.GetLabels(item.Object)
		}

		items = append(items, resItem)
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

	var item *unstructured.Unstructured

	if h.devMode {
		// Normalize kind for mockup lookup
		mockKind := kind
		if kind == "serviceaccounts" { mockKind = "service-accounts" }
		if kind == "nodes" { mockKind = "nodes" }

		unstructuredItems := h.mockRawResourceList(mockKind, ns)
		for i := range unstructuredItems {
			if unstructuredItems[i].GetName() == name {
				item = &unstructuredItems[i]
				break
			}
		}
	} else {
		dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
			return
		}
		gvr := getGVR(kind)
		var resInterface dynamic.ResourceInterface
		if ns != "" && !isClusterScoped(kind) {
			resInterface = dynClient.Resource(gvr).Namespace(ns)
		} else {
			resInterface = dynClient.Resource(gvr)
		}

		raw, err := resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
		if err == nil {
			item = raw
		}
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	response := gin.H{
		"resource": gin.H{
			"name":      item.GetName(),
			"namespace": item.GetNamespace(),
			"age":       utils.GetAge(item.GetCreationTimestamp().Time),
			"status":    item.Object["status"],
		},
		"metadata": item.Object["metadata"],
		"spec":     item.Object["spec"],
		"status":   item.Object["status"],
		"data":     item.Object["data"],
	}

	// Extra safety for missing fields in some K8s versions/objects
	if response["spec"] == nil { response["spec"] = item.Object["spec"] }
	if response["metadata"] == nil { response["metadata"] = item.Object["metadata"] }

	// Extract RBAC and common fields to root for frontend compatibility
	if rules, ok := item.Object["rules"]; ok { response["rules"] = rules }
	if subjects, ok := item.Object["subjects"]; ok { response["subjects"] = subjects }
	if roleRef, ok := item.Object["roleRef"]; ok { response["roleRef"] = roleRef }
	if owners := item.GetOwnerReferences(); len(owners) > 0 { response["ownerReferences"] = owners }

	if kind == "nodes" || kind == "node" {
		response["allocation"] = gin.H{
			"cpu":    gin.H{"requests": 1.5, "limits": 3.0, "capacity": 8.0},
			"memory": gin.H{"requests": 6144, "limits": 12288, "capacity": 32768},
			"pods":   gin.H{"allocation": 24, "capacity": 110},
		}
	}

	if kind == "serviceaccounts" || kind == "service-accounts" || kind == "serviceaccount" {
		response["secrets"] = item.Object["secrets"]
		response["imagePullSecrets"] = item.Object["imagePullSecrets"]
	}

	c.JSON(http.StatusOK, response)
}

func (h *ResourceHandler) GetYAML(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	// Normalize kind for mockup lookup
	mockKind := kind
	if strings.HasSuffix(kind, "s") {
		// already plural
	} else {
		mockKind = kind + "s"
	}
	
	// Special cases
	if kind == "ingress" { mockKind = "ingresses" }
	if kind == "storageclass" { mockKind = "storage-classes" }
	if kind == "networkpolicy" { mockKind = "network-policies" }

	fmt.Printf("[Debug] GetYAML: kind=%s, name=%s, ns=%s -> mockKind=%s\n", kind, name, ns, mockKind)

	var item *unstructured.Unstructured

	if h.devMode {
		unstructuredItems := h.mockRawResourceList(mockKind, ns)
		for _, it := range unstructuredItems {
			if it.GetName() == name {
				item = &it
				break
			}
		}
	} else {
		dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
			return
		}
		gvr := getGVR(kind)
		var resInterface dynamic.ResourceInterface
		if ns != "" && !isClusterScoped(kind) {
			resInterface = dynClient.Resource(gvr).Namespace(ns)
		} else {
			resInterface = dynClient.Resource(gvr)
		}

		raw, err := resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
		if err == nil {
			item = raw
		}
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	// Clean up metadata before showing YAML/JSON
	if meta, ok := item.Object["metadata"].(map[string]interface{}); ok {
		delete(meta, "managedFields")
	}

	format := strings.ToLower(c.Query("format"))
	if format == "json" {
		c.JSON(http.StatusOK, item.Object)
		return
	}

	y, err := yaml.Marshal(item.Object)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate YAML"})
		return
	}

	c.String(http.StatusOK, string(y))
}

func ex(kv ...string) map[string]string {
	m := make(map[string]string, len(kv)/2)
	for i := 0; i+1 < len(kv); i += 2 { m[kv[i]] = kv[i+1] }
	return m
}
