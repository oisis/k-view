package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type StatefulSetManager struct {
	GenericManager
}

func NewStatefulSetManager() *StatefulSetManager {
	return &StatefulSetManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}, false),
	}
}

func (m *StatefulSetManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")
	readyReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
	currentReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "currentReplicas")
	updatedReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedReplicas")
	
	updateStrategy, _, _ := unstructured.NestedString(item.Object, "spec", "updateStrategy", "type")
	serviceName, _, _ := unstructured.NestedString(item.Object, "spec", "serviceName")

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

	resItem.Extra["replicas"] = replicas
	resItem.Extra["readyReplicas"] = readyReplicas
	resItem.Extra["currentReplicas"] = currentReplicas
	resItem.Extra["updatedReplicas"] = updatedReplicas
	resItem.Extra["updateStrategy"] = updateStrategy
	resItem.Extra["serviceName"] = serviceName
	resItem.Extra["images"] = images

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *StatefulSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
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
