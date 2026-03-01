package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	"k-view/pkg/utils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/client-go/dynamic"
	"sigs.k8s.io/yaml"
)

func (h *ResourceHandler) GetStats(c *gin.Context) {
	if isDevMode() {
		c.JSON(http.StatusOK, gin.H{
			"pods":       12,
			"nodes":      3,
			"namespaces": 5,
		})
		return
	}

	dyn, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	podGVR := getGVR("pods")
	nodeGVR := getGVR("nodes")
	nsGVR := getGVR("namespaces")

	pods, _ := dyn.Resource(podGVR).List(c.Request.Context(), metav1.ListOptions{})
	nodes, _ := dyn.Resource(nodeGVR).List(c.Request.Context(), metav1.ListOptions{})
	nss, _ := dyn.Resource(nsGVR).List(c.Request.Context(), metav1.ListOptions{})

	c.JSON(http.StatusOK, gin.H{
		"pods":       len(pods.Items),
		"nodes":      len(nodes.Items),
		"namespaces": len(nss.Items),
	})
}

func (h *ResourceHandler) GetDetails(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	var item *unstructured.Unstructured

	if isDevMode() {
		item, _ = h.getMockResource(kind, ns, name)
	}

	if item == nil {
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
		if err == nil { item = raw }
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	statusData, _, _ := unstructured.NestedMap(item.Object, "status")
	metaData, _, _ := unstructured.NestedMap(item.Object, "metadata")

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

		dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
		podGVR := getGVR("pods")
		podList, err := dynClient.Resource(podGVR).List(c.Request.Context(), metav1.ListOptions{
			FieldSelector: "spec.nodeName=" + name,
		})

		var cpuReq, memReq float64
		podCount := 0
		if err == nil {
			podCount = len(podList.Items)
			for _, p := range podList.Items {
				containers, _, _ := unstructured.NestedSlice(p.Object, "spec", "containers")
				for _, c := range containers {
					if cm, ok := c.(map[string]interface{}); ok {
						reqs, _, _ := unstructured.NestedMap(cm, "resources", "requests")
						cpuReq += k8sutils.ParseCPU(reqs["cpu"])
						memReq += k8sutils.ParseMemory(reqs["memory"])
					}
				}
			}
		}

		response["allocation"] = gin.H{
			"cpu": gin.H{"requests": cpuReq, "allocatable": cpuAlloc, "capacity": cpuCap},
			"memory": gin.H{"requests": memReq, "allocatable": memAlloc, "capacity": memCap},
			"pods": gin.H{"allocation": podCount, "allocatable": podsAlloc, "capacity": podsCap},
		}
	}

	if kind == "services" || kind == "service" {
		dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
		gvr := getGVR("endpoints")
		if ep, err := dynClient.Resource(gvr).Namespace(ns).Get(c.Request.Context(), name, metav1.GetOptions{}); err == nil {
			response["relatedEndpoints"] = ep.Object
		}
	}

	c.JSON(http.StatusOK, response)
}

func (h *ResourceHandler) GetYAML(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	format := c.DefaultQuery("format", "yaml")
	if ns == "-" { ns = "" }

	var item *unstructured.Unstructured

	if isDevMode() {
		item, _ = h.getMockResource(kind, ns, name)
	}

	if item == nil {
		dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		gvr := getGVR(kind)
		var resInterface dynamic.ResourceInterface
		if ns != "" && !isClusterScoped(kind) {
			resInterface = dynClient.Resource(gvr).Namespace(ns)
		} else {
			resInterface = dynClient.Resource(gvr)
		}
		item, err = resInterface.Get(c.Request.Context(), name, metav1.GetOptions{})
	}

	if item == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "resource not found"})
		return
	}

	var output []byte
	var err error
	contentType := "text/yaml"

	if format == "json" {
		output, err = json.MarshalIndent(item.Object, "", "  ")
		contentType = "application/json"
	} else {
		output, err = yaml.Marshal(item.Object)
		contentType = "text/yaml"
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate manifest"})
		return
	}

	c.Header("Content-Type", contentType+"; charset=utf-8")
	c.String(http.StatusOK, string(output))
}
