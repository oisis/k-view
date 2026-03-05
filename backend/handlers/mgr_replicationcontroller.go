package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ReplicationControllerManager struct {
	GenericManager
}

func NewReplicationControllerManager() *ReplicationControllerManager {
	return &ReplicationControllerManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "replicationcontrollers"}, false),
	}
}

func (m *ReplicationControllerManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")
	readyReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
	availableReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")

	// Extract images from spec -> template -> spec -> containers
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
	resItem.Extra["availableReplicas"] = availableReplicas
	resItem.Extra["images"] = images

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *ReplicationControllerManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// Enhance response with specialized extra fields
	mapped := m.MapItem(item, nil)
	if extra, ok := response["extra"].(map[string]interface{}); ok {
		for k, v := range mapped.Extra {
			extra[k] = v
		}
	}

	// Fetch metrics for related Pods
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

	// Fetch related Pods using selector
	selector, found, _ := unstructured.NestedMap(item.Object, "spec", "selector")
	if found {
		// Convert selector to map[string]string for both pods and services
		selMap := make(map[string]string)
		for k, v := range selector {
			if s, ok := v.(string); ok {
				selMap[k] = s
			}
		}

		podMgr := NewPodManager()
		allPods, err := dynClient.Resource(podMgr.GetGVR()).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err == nil {
			var relatedPods []ResourceItem
			for _, pod := range allPods.Items {
				if matchesSelector(selMap, pod.GetLabels()) {
					relatedPods = append(relatedPods, podMgr.MapItem(pod, metricsMap))
				}
			}
			response["relatedPods"] = relatedPods
		}

		// Fetch related Services targeting these pods
		svcMgr := NewServiceManager()
		allSvcs, err := dynClient.Resource(svcMgr.GetGVR()).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err == nil {
			var relatedSvcs []ResourceItem
			// Get labels from the pod template metadata
			templateLabels, _, _ := unstructured.NestedMap(item.Object, "spec", "template", "metadata", "labels")
			
			for _, svc := range allSvcs.Items {
				svcSelector, found, _ := unstructured.NestedMap(svc.Object, "spec", "selector")
				if found && len(svcSelector) > 0 {
					// Check if service selector matches RC template labels
					match := true
					for k, v := range svcSelector {
						val, ok := templateLabels[k]
						if !ok || val != v {
							match = false
							break
						}
					}
					if match {
						svcItem := svcMgr.MapItem(svc, nil)
						// Inject fake external endpoints for UI testing if annotation is present
						if item.GetAnnotations()["k-view.io/test-data"] == "true" {
							svcItem.Extra["external"] = []string{"1.2.3.4", "lb.test.k-view.local"}
						}
						relatedSvcs = append(relatedSvcs, svcItem)
					}
				}
			}
			response["relatedServices"] = relatedSvcs
		}
	}

	// Inject test conditions for UI verification if annotation is present
	if item.GetAnnotations()["k-view.io/test-data"] == "true" {
		if status, ok := response["status"].(map[string]interface{}); ok {
			status["conditions"] = []map[string]interface{}{
				{
					"type":               "ReplicaSetAvailable",
					"status":             "True",
					"lastUpdateTime":     "2026-03-05T10:00:00Z",
					"lastTransitionTime": "2026-03-05T10:00:00Z",
					"reason":             "MinimumReplicasAvailable",
					"message":            "ReplicationController has minimum availability.",
				},
				{
					"type":               "Progressing",
					"status":             "True",
					"lastUpdateTime":     "2026-03-05T10:00:00Z",
					"lastTransitionTime": "2026-03-05T10:00:00Z",
					"reason":             "NewReplicaSetAvailable",
					"message":            "ReplicationController is progressing successfully.",
				},
			}
		}
	}

	return response, nil
}

func matchesSelector(selector, labels map[string]string) bool {
	if len(selector) == 0 {
		return false
	}
	for k, v := range selector {
		if labels[k] != v {
			return false
		}
	}
	return true
}
