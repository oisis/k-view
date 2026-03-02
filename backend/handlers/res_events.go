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

	var unstructuredItems []unstructured.Unstructured

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
		return
	}
	gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	list, err := dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	unstructuredItems = list.Items

	var filtered []gin.H
	for _, item := range unstructuredItems {
		involvedKind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
		involvedName, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")
		
		// Normalize kind: strip trailing 's' and lowercase for comparison
		normInvolvedKind := strings.ToLower(strings.TrimSuffix(involvedKind, "s"))
		normKind := strings.ToLower(strings.TrimSuffix(kind, "s"))

		if normInvolvedKind == normKind && involvedName == name {
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

			firstSeen := "Unknown"
			if firstTimestamp, ok, _ := unstructured.NestedString(item.Object, "firstTimestamp"); ok && firstTimestamp != "" {
				if t, err := time.Parse(time.RFC3339, firstTimestamp); err == nil {
					firstSeen = utils.GetAge(t)
				}
			}

			source, _, _ := unstructured.NestedString(item.Object, "source", "component")
			eName, _, _ := unstructured.NestedString(item.Object, "metadata", "name")

			filtered = append(filtered, gin.H{
				"name":      eName,
				"reason":    reason,
				"message":   message,
				"type":      eType,
				"count":     count,
				"source":    source,
				"firstSeen": firstSeen,
				"lastSeen":  lastSeen,
			})
		}
	}

	c.JSON(http.StatusOK, filtered)
}

func (h *ResourceHandler) GetClusterEvents(c *gin.Context) {
	ns := c.Query("namespace")
	if ns == "-" { ns = "" }

	var unstructuredItems []unstructured.Unstructured

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
		return
	}
	gvr := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	list, err := dynClient.Resource(gvr).Namespace(ns).List(c.Request.Context(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	unstructuredItems = list.Items

	var events []gin.H
	for _, item := range unstructuredItems {
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
			"namespace": item.GetNamespace(),
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

func (h *ResourceHandler) mapEvent(item unstructured.Unstructured, extra map[string]interface{}, resItem *ResourceItem) {
	reason, _, _ := unstructured.NestedString(item.Object, "reason")
	message, _, _ := unstructured.NestedString(item.Object, "message")
	source, _, _ := unstructured.NestedString(item.Object, "source", "component")
	objectKind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
	objectName, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")
	object := fmt.Sprintf("%s/%s", objectKind, objectName)
	count, _, _ := unstructured.NestedInt64(item.Object, "count")
	eType, _, _ := unstructured.NestedString(item.Object, "type")

	firstSeen := "—"
	if firstTimestamp, ok, _ := unstructured.NestedString(item.Object, "firstTimestamp"); ok && firstTimestamp != "" {
		if ft, err := time.Parse(time.RFC3339, firstTimestamp); err == nil {
			firstSeen = utils.GetAge(ft)
		}
	}
	lastSeen := "—"
	if lastTimestamp, ok, _ := unstructured.NestedString(item.Object, "lastTimestamp"); ok && lastTimestamp != "" {
		if lt, err := time.Parse(time.RFC3339, lastTimestamp); err == nil {
			lastSeen = utils.GetAge(lt)
		}
	}

	resItem.Status = eType
	extra["reason"] = reason
	extra["message"] = message
	extra["source"] = source
	extra["object"] = object
	extra["count"] = fmt.Sprintf("%d", count)
	extra["first-seen"] = firstSeen
	extra["last-seen"] = lastSeen
}
