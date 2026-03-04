package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type DaemonSetManager struct {
	GenericManager
}

func NewDaemonSetManager() *DaemonSetManager {
	return &DaemonSetManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}, false),
	}
}

func (m *DaemonSetManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	desired, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredNumberScheduled")
	current, _, _ := unstructured.NestedInt64(item.Object, "status", "currentNumberScheduled")
	ready, _, _ := unstructured.NestedInt64(item.Object, "status", "numberReady")
	available, _, _ := unstructured.NestedInt64(item.Object, "status", "numberAvailable")
	updated, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedNumberScheduled")
	
	updateStrategy, _, _ := unstructured.NestedString(item.Object, "spec", "updateStrategy", "type")

	// Extract images
	var images []string
	containers, found, _ := unstructured.NestedSlice(item.Object, "spec", "template", "spec", "containers")
	if found {
		for _, c := range containers {
			if container, ok := c.(map[string]interface{}); ok {
				if image, ok := container["image"].(string); ok {
					images = append(images, image)
				}
			}
		}
	}

	resItem.Extra["desired"] = desired
	resItem.Extra["current"] = current
	resItem.Extra["readyReplicas"] = ready
	resItem.Extra["available"] = available
	resItem.Extra["updated"] = updated
	resItem.Extra["updateStrategy"] = updateStrategy
	resItem.Extra["images"] = images

	if ready < desired {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *DaemonSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// Fetch related Pods
	podMgr := NewPodManager()
	pods, err := dynClient.Resource(podMgr.GetGVR()).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
	if err == nil {
		var relatedPods []ResourceItem
		for _, pod := range pods.Items {
			for _, owner := range pod.GetOwnerReferences() {
				if owner.UID == item.GetUID() {
					relatedPods = append(relatedPods, podMgr.MapItem(pod, nil))
					break
				}
			}
		}
		response["relatedPods"] = relatedPods
	}

	return response, nil
}
