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

	if h.devMode {
		c.JSON(http.StatusOK, h.mockResourceList(kind, ns))
		return
	}

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

	endpointsMap := make(map[string]string)
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

	var items []ResourceItem
	for _, item := range unstructuredList.Items {
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
	if ns == "-" { ns = "" }

	if h.devMode {
		items := h.mockResourceList(kind, ns)
		var found *ResourceItem
		for _, it := range items {
			if it.Name == name { found = &it; break }
		}
		if found == nil {
			found = &ResourceItem{Name: name, Namespace: ns, Age: "1h", Status: "Active"}
		}

		metadataObj := gin.H{
			"name": found.Name,
			"namespace": found.Namespace,
			"uid": "mock-uid",
			"creationTimestamp": time.Now().Format(time.RFC3339),
			"labels": gin.H{"app": found.Name},
		}
		
		c.JSON(http.StatusOK, gin.H{
			"resource": found,
			"metadata": metadataObj,
			"spec": gin.H{},
			"status": gin.H{"phase": found.Status},
		})
		return
	}

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := getGVR(kind)
	item, err := dynClient.Resource(gvr).Namespace(ns).Get(c.Request.Context(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"resource": gin.H{"name": item.GetName(), "namespace": item.GetNamespace(), "age": utils.GetAge(item.GetCreationTimestamp().Time)},
		"metadata": item.Object["metadata"],
		"spec": item.Object["spec"],
		"status": item.Object["status"],
	})
}

func (h *ResourceHandler) GetYAML(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "placeholder"})
}

func ex(kv ...string) map[string]string {
	m := make(map[string]string, len(kv)/2)
	for i := 0; i+1 < len(kv); i += 2 { m[kv[i]] = kv[i+1] }
	return m
}

func filter(items []ResourceItem, ns string) []ResourceItem {
	if ns == "" { return items }
	var res []ResourceItem
	for _, it := range items {
		if it.Namespace == "" || it.Namespace == ns { res = append(res, it) }
	}
	return res
}

func (h *ResourceHandler) internalMockResourceList(kind, ns string) []ResourceItem {
	return []ResourceItem{
		{Name: "mock-resource", Namespace: "default", Age: "1h", Status: "Running", Extra: map[string]string{"kind": kind}},
	}
}
