package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"k-view/pkg/utils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")

	// Dynamic GVR support for Custom Resources
	group := c.Query("group")
	version := c.Query("version")
	plural := c.Query("plural")

	var items []unstructured.Unstructured

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var gvr schema.GroupVersionResource
	if group != "" && version != "" && plural != "" {
		gvr = schema.GroupVersionResource{Group: group, Version: version, Resource: plural}
	} else {
		gvr = getGVR(kind)
	}

	if gvr.Resource == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown resource kind"})
		return
	}

	var list *unstructured.UnstructuredList
	var errList error
	if ns != "" && !isClusterScoped(kind) && group == "" { // Standard resources check
		list, errList = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	} else if ns != "" && group != "" { // Custom resources might be namespaced
		// We try namespaced first for custom resources if namespace is provided
		list, errList = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
		if errList != nil {
			// Fallback to cluster-scoped if namespaced fails
			list, errList = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
		}
	} else {
		list, errList = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
	}

	if errList != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": errList.Error()})
		return
	}
	items = list.Items

	result := make([]ResourceItem, 0)

	// Fetch metrics if listing pods
	var metricsMap map[string]unstructured.Unstructured
	if kind == "pods" || kind == "pod" {
		mList, _ := h.k8sClient.ListPodMetrics(c.Request.Context(), ns)
		if mList != nil {
			metricsMap = make(map[string]unstructured.Unstructured)
			for _, m := range mList {
				key := m.GetNamespace() + "/" + m.GetName()
				metricsMap[key] = m
			}
		}
	}

	for _, item := range items {
		resItem := ResourceItem{
			Name:      item.GetName(),
			Namespace: item.GetNamespace(),
			Age:       utils.GetAge(item.GetCreationTimestamp().Time),
			Status:    "Active",
		}

		// Pass metrics to mapper if available
		h.mapResourceSpecificsWithMetrics(item, kind, &resItem, metricsMap)
		result = append(result, resItem)
	}

	c.JSON(http.StatusOK, result)
}
