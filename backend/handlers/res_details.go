package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	"k-view/pkg/utils"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"sigs.k8s.io/yaml"
)

// GetStats returns global cluster resource usage and counts.
// @Summary Cluster Stats
// @Description Get global cluster resource usage (CPU, RAM) and resource counts (Nodes, Pods, Namespaces)
// @Tags Cluster
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/stats [get]
func (h *ResourceHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	// 1. Get Core Resources
	pods, _ := h.k8sClient.ListAllPods(ctx)
	nodes, _ := h.k8sClient.ListAllNodes(ctx)
	namespaces, _ := h.k8sClient.ListNamespaces(ctx)

	// 2. Metrics Logic
	nodeMetrics, _ := h.k8sClient.ListNodeMetrics(ctx)
	metricsAvailable := nodeMetrics != nil && len(nodeMetrics) > 0

	var totalCPUUsage, totalRAMUsage int64
	var totalCPUCapacity, totalRAMCapacity int64

	// Calculate Capacity from Nodes
	for _, node := range nodes {
		totalCPUCapacity += node.Status.Capacity.Cpu().MilliValue()
		totalRAMCapacity += node.Status.Capacity.Memory().Value()
	}

	// Calculate Usage from Metrics
	if metricsAvailable {
		for _, m := range nodeMetrics {
			usage, found, _ := unstructured.NestedMap(m.Object, "usage")
			if found {
				cpuStr := usage["cpu"].(string)
				memStr := usage["memory"].(string)

				if q, err := resource.ParseQuantity(cpuStr); err == nil {
					totalCPUUsage += q.MilliValue()
				}
				if q, err := resource.ParseQuantity(memStr); err == nil {
					totalRAMUsage += q.Value()
				}
			}
		}
	}

	// Calculate percentages
	cpuPercent := 0.0
	if totalCPUCapacity > 0 {
		cpuPercent = (float64(totalCPUUsage) / float64(totalCPUCapacity)) * 100
	}
	ramPercent := 0.0
	if totalRAMCapacity > 0 {
		ramPercent = (float64(totalRAMUsage) / float64(totalRAMCapacity)) * 100
	}

	// 3. Status Counts
	nodesReady := 0
	for _, n := range nodes {
		for _, cond := range n.Status.Conditions {
			if cond.Type == corev1.NodeReady && cond.Status == corev1.ConditionTrue {
				nodesReady++
				break
			}
		}
	}

	podsFailed := 0
	for _, p := range pods {
		if p.Status.Phase == corev1.PodFailed || p.Status.Phase == corev1.PodUnknown {
			podsFailed++
		}
	}

	// 4. Response
	now := time.Now().Format("15:04:05")
	
	cpuTotalCores := float64(totalCPUCapacity) / 1000
	ramTotalBytes := totalRAMCapacity
	cpuUsedCores := float64(totalCPUUsage) / 1000
	ramUsedBytes := totalRAMUsage

	c.JSON(http.StatusOK, gin.H{
		"metricsServer":   metricsAvailable,
		"nodeCount":       len(nodes),
		"nodeCountReady":  nodesReady,
		"podCount":        len(pods),
		"podCountFailed":  podsFailed,
		"namespaceCount": len(namespaces),
		"cpuUsage":        cpuPercent,
		"ramUsage":        ramPercent,
		"cpuTotal":        cpuTotalCores,
		"ramTotal":        ramTotalBytes,
		"cpuUsed":         cpuUsedCores,
		"ramUsed":         ramUsedBytes,
		"clusterName":     "Local Cluster",
		"k8sVersion":      "v1.29+",
		"cpuHistory": []MetricHistory{
			{Timestamp: now, Value: cpuPercent},
		},
		"ramHistory": []MetricHistory{
			{Timestamp: now, Value: ramPercent},
		},
	})
}

// GetDetails returns detailed information about a specific resource.
// @Summary Resource Details
// @Description Get detailed information about a specific Kubernetes resource, including metadata, spec, status, and related resources
// @Tags Resources
// @Produce json
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /api/resources/{kind}/{namespace}/{name} [get]
func (h *ResourceHandler) GetDetails(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	// CRITICAL RBAC REQUIREMENT: Apply namespace restriction from auth context
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		// Override requested namespace with the user's restricted namespace
		ns = rbacNs.(string)
	}

	var item *unstructured.Unstructured

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
		return
	}

	manager := h.registry.GetManager(kind)

	var gvr schema.GroupVersionResource
	isClusterScopedRes := isClusterScoped(kind)

	if manager != h.registry.fallback {
		gvr = manager.GetGVR()
		isClusterScopedRes = manager.IsClusterScoped()
	} else {
		gvr = getGVR(kind)
	}

	var resInterface dynamic.ResourceInterface
	if ns != "" && !isClusterScopedRes {
		resInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		resInterface = dynClient.Resource(gvr)
	}

	item, err = resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})

	if err != nil || item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found or access denied"})
		return
	}

	// Strategy delegation for details
	if manager != h.registry.fallback {
		response, err := manager.GetDetails(c.Request.Context(), dynClient, *item)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
			return
		}
		c.JSON(http.StatusOK, response)
		return
	}

	// Fallback to legacy details mapping for resources not yet migrated
	statusData, _, _ := unstructured.NestedMap(item.Object, "status")
	metaData, _, _ := unstructured.NestedMap(item.Object, "metadata")

	extra := make(map[string]interface{})
	resItem := ResourceItem{
		Name:      item.GetName(),
		Namespace: item.GetNamespace(),
		Age:       utils.GetAge(item.GetCreationTimestamp().Time),
		Status:    "Active",
		Extra:     extra,
	}
	h.mapResourceSpecifics(*item, kind, &resItem)

	response := gin.H{
		"resource": gin.H{
			"name":      item.GetName(),
			"namespace": item.GetNamespace(),
			"age":       utils.GetAge(item.GetCreationTimestamp().Time),
			"status":    statusData,
		},
		"metadata": metaData,
		"spec":     item.Object["spec"],
		"status":   statusData,
		"data":     item.Object["data"],
		"extra":    resItem.Extra,
	}

	// For cluster-scoped resources like StorageClass, many fields are at the root
	for k, v := range item.Object {
		if k != "metadata" && k != "status" && k != "spec" {
			response[k] = v
		}
	}

	if kind == "pods" || kind == "pod" {
		metrics, err := h.k8sClient.GetPodMetrics(c.Request.Context(), ns, name)
		if err == nil && metrics != nil {
			response["metrics"] = metrics
		}
	}

	if kind == "nodes" || kind == "node" {
		// Node allocation stats logic
		allocatable, _, _ := unstructured.NestedMap(item.Object, "status", "allocatable")
		capacity, _, _ := unstructured.NestedMap(item.Object, "status", "capacity")
		
		cpuCap := k8sutils.ParseCPU(capacity["cpu"])
		cpuAlloc := k8sutils.ParseCPU(allocatable["cpu"])
		memCap := k8sutils.ParseMemory(capacity["memory"])
		memAlloc := k8sutils.ParseMemory(allocatable["memory"])
		podsCap := k8sutils.ParseQuantity(capacity["pods"])
		podsAlloc := k8sutils.ParseQuantity(allocatable["pods"])

		podGVR := getGVR("pods")
		podList, err := dynClient.Resource(podGVR).List(c.Request.Context(), metav1.ListOptions{
			FieldSelector: "spec.nodeName=" + name,
		})

		// Fetch metrics for pods to show CPU/RAM in the table
		metricsList, _ := h.k8sClient.ListPodMetrics(c.Request.Context(), "")
		metricsMap := make(map[string]unstructured.Unstructured)
		for _, m := range metricsList {
			metricsMap[m.GetNamespace()+"/"+m.GetName()] = m
		}

		var cpuReq, memReq, cpuLim, memLim float64
		podCount := 0
		var nodePods []ResourceItem
		podMgr := NewPodManager()
		
		if err == nil {
			podCount = len(podList.Items)
			for _, p := range podList.Items {
				// Metrics calculation
				containers, _, _ := unstructured.NestedSlice(p.Object, "spec", "containers")
				for _, c := range containers {
					if cm, ok := c.(map[string]interface{}); ok {
						reqs, _, _ := unstructured.NestedMap(cm, "resources", "requests")
						lims, _, _ := unstructured.NestedMap(cm, "resources", "limits")
						cpuReq += k8sutils.ParseCPU(reqs["cpu"])
						memReq += k8sutils.ParseMemory(reqs["memory"])
						cpuLim += k8sutils.ParseCPU(lims["cpu"])
						memLim += k8sutils.ParseMemory(lims["memory"])
					}
				}
				// Full DTO mapping with metrics
				nodePods = append(nodePods, podMgr.MapItem(p, metricsMap))
			}
		}

		response["relatedPods"] = nodePods
		response["allocation"] = gin.H{
			"cpu": gin.H{"requests": cpuReq, "limits": cpuLim, "allocatable": cpuAlloc, "capacity": cpuCap},
			"memory": gin.H{"requests": memReq, "limits": memLim, "allocatable": memAlloc, "capacity": memCap},
			"pods": gin.H{"allocation": podCount, "allocatable": podsAlloc, "capacity": podsCap},
		}
	}

	if kind == "services" || kind == "service" {
		gvrEp := getGVR("endpoints")
		if ep, err := dynClient.Resource(gvrEp).Namespace(ns).Get(c.Request.Context(), name, metav1.GetOptions{}); err == nil {
			response["relatedEndpoints"] = ep.Object
		}
	}

	if kind == "service-accounts" || kind == "serviceaccount" {
		secretGVR := getGVR("secrets")
		
		// 1. Fetch regular secrets
		if secrets, ok, _ := unstructured.NestedSlice(item.Object, "secrets"); ok {
			var fullSecrets []ResourceItem
			for _, s := range secrets {
				if sm, ok := s.(map[string]interface{}); ok {
					sName, _ := sm["name"].(string)
					if sObj, err := dynClient.Resource(secretGVR).Namespace(ns).Get(c.Request.Context(), sName, metav1.GetOptions{}); err == nil {
						res := ResourceItem{
							Name:      sObj.GetName(),
							Namespace: sObj.GetNamespace(),
							Age:       utils.GetAge(sObj.GetCreationTimestamp().Time),
							Status:    "Active",
							Extra:     make(map[string]interface{}),
						}
						h.mapResourceSpecifics(*sObj, "secrets", &res)
						fullSecrets = append(fullSecrets, res)
					}
				}
			}
			response["relatedSecrets"] = fullSecrets
		}

		// 2. Fetch image pull secrets
		if ips, ok, _ := unstructured.NestedSlice(item.Object, "imagePullSecrets"); ok {
			var fullIps []ResourceItem
			for _, s := range ips {
				if sm, ok := s.(map[string]interface{}); ok {
					sName, _ := sm["name"].(string)
					if sObj, err := dynClient.Resource(secretGVR).Namespace(ns).Get(c.Request.Context(), sName, metav1.GetOptions{}); err == nil {
						res := ResourceItem{
							Name:      sObj.GetName(),
							Namespace: sObj.GetNamespace(),
							Age:       utils.GetAge(sObj.GetCreationTimestamp().Time),
							Status:    "Active",
							Extra:     make(map[string]interface{}),
						}
						h.mapResourceSpecifics(*sObj, "secrets", &res)
						fullIps = append(fullIps, res)
					}
				}
			}
			response["relatedImagePullSecrets"] = fullIps
		}
	}

	c.JSON(http.StatusOK, response)
}

type TopologyNode struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Kind      string `json:"kind"`
	Namespace string `json:"namespace,omitempty"`
	Status    string `json:"status,omitempty"`
}

type TopologyEdge struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
}

type TopologyResponse struct {
	Nodes []TopologyNode `json:"nodes"`
	Edges []TopologyEdge `json:"edges"`
}

// GetTopology returns the relationship graph for a specific resource.
// @Summary Resource Topology
// @Description Get a graph of related resources (owners, children, selectors) for a specific resource
// @Tags Resources
// @Produce json
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Success 200 {object} TopologyResponse
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /api/topology/{kind}/{namespace}/{name} [get]
func (h *ResourceHandler) GetTopology(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" {
		ns = ""
	}

	ctx := c.Request.Context()
	dynClient, err := h.k8sClient.GetDynamicClient(ctx)
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

	rootItem, err := resInterface.Get(ctx, name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	rootID := fmt.Sprintf("%s/%s/%s", rootItem.GetKind(), rootItem.GetNamespace(), rootItem.GetName())
	nodes := make([]TopologyNode, 0)
	edges := make([]TopologyEdge, 0)
	nodeMap := make(map[string]bool)
	processedUIDs := make(map[string]bool)

	// Helper to add node
	addNode := func(item *unstructured.Unstructured) string {
		id := fmt.Sprintf("%s/%s/%s", item.GetKind(), item.GetNamespace(), item.GetName())
		if !nodeMap[id] {
			nodes = append(nodes, TopologyNode{
				ID:        id,
				Name:      item.GetName(),
				Kind:      item.GetKind(),
				Namespace: item.GetNamespace(),
				Status:    "Active",
			})
			nodeMap[id] = true
		}
		return id
	}

	// Add root node
	addNode(rootItem)
	processedUIDs[string(rootItem.GetUID())] = true

	// Queue for recursive discovery
	type task struct {
		item *unstructured.Unstructured
		id   string
	}
	queue := []task{{item: rootItem, id: rootID}}

	childKinds := []string{"ReplicaSets", "Pods", "Jobs", "PersistentVolumeClaims"}

	// 1. Discover Children Recursively
	for len(queue) > 0 {
		current := queue[0]
		queue = queue[1:]

		for _, ck := range childKinds {
			cgvr := getGVR(ck)
			list, err := dynClient.Resource(cgvr).Namespace(ns).List(ctx, metav1.ListOptions{})
			if err == nil {
				for _, item := range list.Items {
					for _, owner := range item.GetOwnerReferences() {
						if owner.UID == current.item.GetUID() {
							childID := addNode(&item)
							edges = append(edges, TopologyEdge{
								ID:     fmt.Sprintf("e-%s-%s", current.id, childID),
								Source: current.id,
								Target: childID,
								Type:   "owner",
							})
							
							if !processedUIDs[string(item.GetUID())] {
								processedUIDs[string(item.GetUID())] = true
								queue = append(queue, task{item: &item, id: childID})
							}
						}
					}
				}
			}
		}
	}

	// 1.1 Discover NetworkPolicies (Security)
	if ns != "" {
		netPolGVR := schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
		netPols, err := dynClient.Resource(netPolGVR).Namespace(ns).List(ctx, metav1.ListOptions{})
		if err == nil {
			for _, np := range netPols.Items {
				selector, found, _ := unstructured.NestedMap(np.Object, "spec", "podSelector", "matchLabels")
				if found && len(selector) > 0 {
					sMap := make(map[string]string)
					for k, v := range selector {
						sMap[k] = fmt.Sprintf("%v", v)
					}
					podSelector := labels.SelectorFromSet(sMap)

					// Check all nodes in graph if they are pods and match this policy
					for _, node := range nodes {
						if node.Kind == "Pod" && node.Namespace == ns {
							// We need the actual pod labels to match
							podGVR := getGVR("pods")
							pod, err := dynClient.Resource(podGVR).Namespace(ns).Get(ctx, node.Name, metav1.GetOptions{})
							if err == nil && podSelector.Matches(labels.Set(pod.GetLabels())) {
								npID := addNode(&np)
								edges = append(edges, TopologyEdge{
									ID:     fmt.Sprintf("e-%s-%s", npID, node.ID),
									Source: npID,
									Target: node.ID,
									Type:   "security",
								})
							}
						}
					}
				}
			}
		}
	}

	// 1.2 Discover HPAs (Scaling)
	if ns != "" {
		hpaGVR := schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
		hpas, err := dynClient.Resource(hpaGVR).Namespace(ns).List(ctx, metav1.ListOptions{})
		if err == nil {
			for _, hpa := range hpas.Items {
				targetKind, _, _ := unstructured.NestedString(hpa.Object, "spec", "scaleTargetRef", "kind")
				targetName, _, _ := unstructured.NestedString(hpa.Object, "spec", "scaleTargetRef", "name")

				for _, node := range nodes {
					if node.Kind == targetKind && node.Name == targetName && node.Namespace == ns {
						hpaID := addNode(&hpa)
						edges = append(edges, TopologyEdge{
							ID:     fmt.Sprintf("e-%s-%s", hpaID, node.ID),
							Source: hpaID,
							Target: node.ID,
							Type:   "scaling",
						})
					}
				}
			}
		}
	}

	// 2. Find Parents (only for the root item)
	for _, owner := range rootItem.GetOwnerReferences() {
		parentID := fmt.Sprintf("%s/%s/%s", owner.Kind, rootItem.GetNamespace(), owner.Name)
		
		if !nodeMap[parentID] {
			nodes = append(nodes, TopologyNode{
				ID:        parentID,
				Name:      owner.Name,
				Kind:      owner.Kind,
				Namespace: rootItem.GetNamespace(),
			})
			nodeMap[parentID] = true
		}
		edges = append(edges, TopologyEdge{
			ID:     fmt.Sprintf("e-%s-%s", parentID, rootID),
			Source: parentID,
			Target: rootID,
			Type:   "owner",
		})
	}

	// 3. Special Case: Service -> Pods (via Selectors)
	if strings.ToLower(rootItem.GetKind()) == "service" {
		selector, found, _ := unstructured.NestedStringMap(rootItem.Object, "spec", "selector")
		if found && len(selector) > 0 {
			labelSelector := metav1.FormatLabelSelector(&metav1.LabelSelector{MatchLabels: selector})
			podGVR := getGVR("pods")
			pods, err := dynClient.Resource(podGVR).Namespace(ns).List(ctx, metav1.ListOptions{
				LabelSelector: labelSelector,
			})
			if err == nil {
				for _, pod := range pods.Items {
					podID := fmt.Sprintf("%s/%s/%s", pod.GetKind(), pod.GetNamespace(), pod.GetName())
					if !nodeMap[podID] {
						nodes = append(nodes, TopologyNode{
							ID:        podID,
							Name:      pod.GetName(),
							Kind:      pod.GetKind(),
							Namespace: pod.GetNamespace(),
						})
						nodeMap[podID] = true
					}
					edges = append(edges, TopologyEdge{
						ID:     fmt.Sprintf("e-%s-%s", rootID, podID),
						Source: rootID,
						Target: podID,
						Type:   "selector",
					})
				}
			}
		}
	}

	c.JSON(http.StatusOK, TopologyResponse{
		Nodes: nodes,
		Edges: edges,
	})
}

// GetYAML returns the raw manifest of a resource in YAML or JSON format.
// @Summary Get Resource YAML/JSON
// @Description Get the raw manifest of a specific Kubernetes resource
// @Tags Resources
// @Produce plain
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Param format query string false "Output format (yaml or json)" default(yaml)
// @Success 200 {string} string "Manifest content"
// @Failure 404 {object} map[string]string
// @Security BearerAuth
// @Router /api/resources/{kind}/{namespace}/{name}/yaml [get]
func (h *ResourceHandler) GetYAML(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	format := c.DefaultQuery("format", "yaml")
	if ns == "-" { ns = "" }

	var item *unstructured.Unstructured

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}
	gvr := getGVR(kind)
	var resInterface dynamic.ResourceInterface
	if ns != "" && !isClusterScoped(kind) {
		resInterface = dynClient.Resource(gvr).Namespace(ns)
	} else {
		resInterface = dynClient.Resource(gvr)
	}
	item, _ = resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	var output []byte
	contentType := "text/yaml"

	if format == "json" {
		output, _ = json.MarshalIndent(item.Object, "", "  ")
		contentType = "application/json"
	} else {
		output, _ = yaml.Marshal(item.Object)
		contentType = "text/yaml"
	}

	c.Header("Content-Type", contentType+"; charset=utf-8")
	c.String(http.StatusOK, string(output))
}
