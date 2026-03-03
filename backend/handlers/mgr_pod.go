package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type PodManager struct {
	GenericManager
}

func NewPodManager() *PodManager {
	return &PodManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}, false),
	}
}

func (m *PodManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	// Pod specific mapping
	statusPhase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	resItem.Status = statusPhase

	// Calculate specific status from container statuses (like CrashLoopBackOff etc)
	if statuses, ok, _ := unstructured.NestedSlice(item.Object, "status", "containerStatuses"); ok {
		for _, s := range statuses {
			if sMap, ok := s.(map[string]interface{}); ok {
				if waiting, ok, _ := unstructured.NestedMap(sMap, "state", "waiting"); ok {
					if reason, ok := waiting["reason"].(string); ok {
						resItem.Status = reason
						break
					}
				}
			}
		}
	}

	// Restarts count
	restarts := int64(0)
	if statuses, ok, _ := unstructured.NestedSlice(item.Object, "status", "containerStatuses"); ok {
		for _, s := range statuses {
			if sMap, ok := s.(map[string]interface{}); ok {
				if r, ok, _ := unstructured.NestedInt64(sMap, "restartCount"); ok {
					restarts += r
				}
			}
		}
	}
	resItem.Extra["restarts"] = restarts

	// Metrics
	key := item.GetNamespace() + "/" + item.GetName()
	if metric, ok := metricsMap[key]; ok {
		if containers, ok, _ := unstructured.NestedSlice(metric.Object, "containers"); ok {
			var totalCPU, totalMemory float64
			for _, c := range containers {
				if cmap, ok := c.(map[string]interface{}); ok {
					if usage, ok, _ := unstructured.NestedMap(cmap, "usage"); ok {
						totalCPU += k8sutils.ParseCPU(usage["cpu"])
						totalMemory += k8sutils.ParseMemory(usage["memory"])
					}
				}
			}
			resItem.Extra["cpu"] = totalCPU
			resItem.Extra["memory"] = totalMemory
		}
	}

	return resItem
}

func (m *PodManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// Fetch metrics if available
	metricsGVR := schema.GroupVersionResource{Group: "metrics.k8s.io", Version: "v1beta1", Resource: "pods"}
	metricsItem, err := dynClient.Resource(metricsGVR).Namespace(item.GetNamespace()).Get(ctx, item.GetName(), metav1.GetOptions{})
	if err == nil && metricsItem != nil {
		// DTO isolation: extract only necessary metric fields
		var podCpu, podMem float64
		if containers, ok, _ := unstructured.NestedSlice(metricsItem.Object, "containers"); ok {
			for _, c := range containers {
				if cmap, ok := c.(map[string]interface{}); ok {
					if usage, ok, _ := unstructured.NestedMap(cmap, "usage"); ok {
						podCpu += k8sutils.ParseCPU(usage["cpu"])
						podMem += k8sutils.ParseMemory(usage["memory"])
					}
				}
			}
		}
		response["metrics"] = gin.H{
			"cpu": podCpu,
			"memory": podMem,
		}
	}

	return response, nil
}
