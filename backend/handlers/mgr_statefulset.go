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

	// Enhance response with specialized extra fields (including images)
	mapped := m.MapItem(item, nil)
	if extra, ok := response["extra"].(map[string]interface{}); ok {
		for k, v := range mapped.Extra {
			extra[k] = v
		}
	}

	// Fetch metrics for related Pods using the dynamic client
	metricsGVR := schema.GroupVersionResource{
		Group:    "metrics.k8s.io",
		Version:  "v1beta1",
		Resource: "pods",
	}
	var metricsMap map[string]unstructured.Unstructured
	mList, err := dynClient.Resource(metricsGVR).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
	if err == nil {
		metricsMap = make(map[string]unstructured.Unstructured)
		for _, m := range mList.Items {
			key := m.GetNamespace() + "/" + m.GetName()
			metricsMap[key] = m
		}
	}

	// Fetch related Pods
	podMgr := NewPodManager()
	pods, err := dynClient.Resource(podMgr.GetGVR()).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
	if err == nil {
		var relatedPods []ResourceItem
		for _, pod := range pods.Items {
			for _, owner := range pod.GetOwnerReferences() {
				if owner.UID == item.GetUID() {
					relatedPods = append(relatedPods, podMgr.MapItem(pod, metricsMap))
					break
				}
			}
		}
		response["relatedPods"] = relatedPods
	}

	return response, nil
}
