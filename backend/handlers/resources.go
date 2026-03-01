package handlers

import (
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

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")

	var items []unstructured.Unstructured

	if isDevMode() {
		items, _ = h.getMockResources(kind, ns)
	}

	if items == nil {
		dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		gvr := getGVR(kind)
		var list *unstructured.UnstructuredList
		if ns != "" && !isClusterScoped(kind) {
			list, err = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
		} else {
			list, err = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
		}

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		items = list.Items
	}

	// Prepare result
	result := make([]ResourceItem, 0)
	for _, item := range items {
		resItem := ResourceItem{
			Name:      item.GetName(),
			Namespace: item.GetNamespace(),
			Age:       utils.GetAge(item.GetCreationTimestamp().Time),
			Status:    "Active",
			Extra:     map[string]string{"kind": item.GetKind()},
		}

		if len(item.GetOwnerReferences()) > 0 {
			resItem.Extra["owner-uid"] = string(item.GetOwnerReferences()[0].UID)
		}

		// Use centralized mapping with the full item pointer
		h.mapResourceSpecifics(item, kind, &resItem)

		result = append(result, resItem)
	}

	c.JSON(http.StatusOK, result)
}

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

	y, err := yaml.Marshal(item.Object)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate YAML"})
		return
	}

	c.String(http.StatusOK, string(y))
}

func (h *ResourceHandler) mapResourceSpecifics(item unstructured.Unstructured, kind string, resItem *ResourceItem) {
	resItem.Extra["labels"] = k8sutils.GetLabels(item.Object)
	resItem.Extra["annotations"] = k8sutils.GetAnnotations(item.Object)

	switch kind {
	case "pods", "pod", "deployments", "deployment", "statefulsets", "statefulset", "daemonsets", "daemonset", "jobs", "job", "replicasets", "replicaset", "replicationcontrollers":
		h.mapWorkload(item, kind, resItem.Extra, resItem)
	case "services", "service", "ingresses", "ingress", "ingress-classes", "ingressclass", "network-policies", "networkpolicy":
		h.mapNetwork(item, kind, resItem.Extra, resItem, nil)
	case "persistentvolumeclaims", "pvcs", "persistentvolumes", "pvs", "storage-classes", "storageclass", "secrets", "secret":
		h.mapStorage(item, kind, resItem.Extra, resItem)
	}
}
