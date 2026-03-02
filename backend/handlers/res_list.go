package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"k-view/pkg/utils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
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
		var errList error
		if ns != "" && !isClusterScoped(kind) {
			list, errList = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
		} else {
			list, errList = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
		}

		if errList != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": errList.Error()})
			return
		}
		items = list.Items
	}

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
