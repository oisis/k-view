package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func (h *ResourceHandler) List(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Query("namespace")

	// CRITICAL RBAC REQUIREMENT: Apply namespace restriction from auth context
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		// Override requested namespace with the user's restricted namespace
		ns = rbacNs.(string)
	}

	// Dynamic GVR support for Custom Resources
	group := c.Query("group")
	version := c.Query("version")
	plural := c.Query("plural")

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}

	// Strategy selection
	manager := h.registry.GetManager(kind)

	var gvr schema.GroupVersionResource
	if group != "" && version != "" && plural != "" {
		gvr = schema.GroupVersionResource{Group: group, Version: version, Resource: plural}
	} else if manager != h.registry.fallback {
		gvr = manager.GetGVR()
	} else {
		gvr = getGVR(kind)
	}

	if gvr.Resource == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown resource kind"})
		return
	}

	// For custom resources, if we don't know the scope, try namespaced first
	var list *unstructured.UnstructuredList
	var errList error
	
	isClusterScopedRes := isClusterScoped(kind)
	if manager != h.registry.fallback {
		isClusterScopedRes = manager.IsClusterScoped()
	}

	if ns != "" && !isClusterScopedRes && group == "" {
		list, errList = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	} else if ns != "" && group != "" {
		list, errList = dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
		if errList != nil {
			list, errList = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
		}
	} else {
		list, errList = dynClient.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{})
	}

	if errList != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(errList)})
		return
	}

	// Fetch metrics if listing pods (strategy can also handle this, but fetching here minimizes API calls for Lists)
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

	result := make([]ResourceItem, 0)
	for _, item := range list.Items {
		// Strategy delegation for Map
		if manager != h.registry.fallback {
			result = append(result, manager.MapItem(item, metricsMap))
		} else {
			// Fallback to legacy map ResourceSpecifics for resources not yet migrated
			resItem := ResourceItem{
				Name:      item.GetName(),
				Namespace: item.GetNamespace(),
				Status:    "Active",
			}
			h.mapResourceSpecificsWithMetrics(item, kind, &resItem, metricsMap)
			result = append(result, resItem)
		}
	}

	c.JSON(http.StatusOK, result)
}
