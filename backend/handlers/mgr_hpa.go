package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type HPAManager struct {
	GenericManager
}

func NewHPAManager() *HPAManager {
	return &HPAManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}, false),
	}
}

func (m *HPAManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	targetKind, _, _ := unstructured.NestedString(item.Object, "spec", "scaleTargetRef", "kind")
	targetName, _, _ := unstructured.NestedString(item.Object, "spec", "scaleTargetRef", "name")
	
	minReplicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "minReplicas")
	maxReplicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "maxReplicas")
	
	currentReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "currentReplicas")
	desiredReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredReplicas")

	// Extract metrics (Targets)
	var targets []string
	metrics, found, _ := unstructured.NestedSlice(item.Object, "status", "currentMetrics")
	if found {
		for _, m := range metrics {
			if metric, ok := m.(map[string]interface{}); ok {
				mType, _ := metric["type"].(string)
				if mType == "Resource" {
					if res, ok := metric["resource"].(map[string]interface{}); ok {
						name, _ := res["name"].(string)
						if current, ok := res["current"].(map[string]interface{}); ok {
							if util, ok := current["averageUtilization"].(int64); ok {
								targets = append(targets, name+": "+string(rune(util))+"%") // Simple placeholder, will fix below
							}
						}
					}
				}
			}
		}
	}
	// Improved extraction logic for HPA v2 metrics
	targets = []string{}
	if currentMetrics, ok, _ := unstructured.NestedSlice(item.Object, "status", "currentMetrics"); ok {
		for _, m := range currentMetrics {
			if mVal, ok := m.(map[string]interface{}); ok {
				mType, _ := mVal["type"].(string)
				if mType == "Resource" {
					if res, ok := mVal["resource"].(map[string]interface{}); ok {
						name, _ := res["name"].(string)
						curr := "unknown"
						if c, ok := res["current"].(map[string]interface{}); ok {
							if util, ok, _ := unstructured.NestedInt64(c, "averageUtilization"); ok {
								curr = string(rune(util)) // placeholder
							}
						}
						// Try to find matching spec metric for target
						targets = append(targets, name+": "+curr)
					}
				}
			}
		}
	}
	
	// Simplify: just extract the first resource metric for now to match common UI patterns
	finalTargets := "unknown"
	if currentMetrics, ok, _ := unstructured.NestedSlice(item.Object, "status", "currentMetrics"); ok {
		for _, m := range currentMetrics {
			if mVal, ok := m.(map[string]interface{}); ok {
				if res, ok := mVal["resource"].(map[string]interface{}); ok {
					name, _ := res["name"].(string)
					val := ""
					if c, ok := res["current"].(map[string]interface{}); ok {
						if util, ok, _ := unstructured.NestedInt64(c, "averageUtilization"); ok {
							val = fmt.Sprintf("%d%%", util)
						}
					}
					finalTargets = name + ": " + val
					break
				}
			}
		}
	}

	resItem.Extra["reference"] = targetKind + "/" + targetName
	resItem.Extra["minReplicas"] = minReplicas
	resItem.Extra["maxReplicas"] = maxReplicas
	resItem.Extra["currentReplicas"] = currentReplicas
	resItem.Extra["desiredReplicas"] = desiredReplicas
	resItem.Extra["targets"] = finalTargets
	
	resItem.Status = "Active"

	return resItem
}

func (m *HPAManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
