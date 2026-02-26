package handlers

import (
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"k-view/pkg/utils"
)

func (h *ResourceHandler) GetEvents(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	
	list, err := dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var filtered []gin.H
	for _, item := range list.Items {
		involvedKind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
		involvedName, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")
		
		if strings.ToLower(involvedKind) == kind && involvedName == name {
			reason, _, _ := unstructured.NestedString(item.Object, "reason")
			message, _, _ := unstructured.NestedString(item.Object, "message")
			eType, _, _ := unstructured.NestedString(item.Object, "type")
			count, _, _ := unstructured.NestedInt64(item.Object, "count")
			lastSeen := "Unknown"
			if lastTimestamp, ok, _ := unstructured.NestedString(item.Object, "lastTimestamp"); ok && lastTimestamp != "" {
				if t, err := time.Parse(time.RFC3339, lastTimestamp); err == nil {
					lastSeen = utils.GetAge(t)
				}
			}

			filtered = append(filtered, gin.H{
				"reason":   reason,
				"message":  message,
				"type":     eType,
				"count":    count,
				"lastSeen": lastSeen,
			})
		}
	}

	c.JSON(http.StatusOK, filtered)
}

func (h *ResourceHandler) GetClusterEvents(c *gin.Context) {
	ns := c.Query("namespace")
	if ns == "-" { ns = "" }

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	
	list, err := dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var events []gin.H
	for _, item := range list.Items {
		name, _, _ := unstructured.NestedString(item.Object, "metadata", "name")
		reason, _, _ := unstructured.NestedString(item.Object, "reason")
		message, _, _ := unstructured.NestedString(item.Object, "message")
		source, _, _ := unstructured.NestedString(item.Object, "source", "component")
		objectKind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
		objectName, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")
		object := fmt.Sprintf("%s/%s", objectKind, objectName)
		count, _, _ := unstructured.NestedInt64(item.Object, "count")
		
		firstSeen := "Unknown"
		if firstTimestamp, ok, _ := unstructured.NestedString(item.Object, "firstTimestamp"); ok && firstTimestamp != "" {
			if ft, err := time.Parse(time.RFC3339, firstTimestamp); err == nil {
				firstSeen = utils.GetAge(ft)
			}
		}
		lastSeen := "Unknown"
		if lastTimestamp, ok, _ := unstructured.NestedString(item.Object, "lastTimestamp"); ok && lastTimestamp != "" {
			if lt, err := time.Parse(time.RFC3339, lastTimestamp); err == nil {
				lastSeen = utils.GetAge(lt)
			}
		}

		events = append(events, gin.H{
			"name":      name,
			"reason":    reason,
			"message":   message,
			"source":    source,
			"object":    object,
			"count":     count,
			"firstSeen": firstSeen,
			"lastSeen":  lastSeen,
		})
	}

	sort.Slice(events, func(i, j int) bool {
		return events[i]["name"].(string) > events[j]["name"].(string)
	})

	c.JSON(http.StatusOK, events)
}
