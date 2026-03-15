package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ReplicaSetManager struct {
	GenericManager
}

func NewReplicaSetManager() *ReplicaSetManager {
	return &ReplicaSetManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}, false),
	}
}

func (m *ReplicaSetManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")
	fullyLabeledReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "fullyLabeledReplicas")
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

	// Extract init images from spec -> template -> spec -> initContainers
	var initImages []string
	initContainers, found, _ := unstructured.NestedSlice(item.Object, "spec", "template", "spec", "initContainers")
	if found {
		for _, c := range initContainers {
			if container, ok := c.(map[string]interface{}); ok {
				if image, ok := container["image"].(string); ok {
					initImages = append(initImages, image)
				}
			}
		}
	}

	resItem.Extra["replicas"] = replicas
	resItem.Extra["fullyLabeledReplicas"] = fullyLabeledReplicas
	resItem.Extra["readyReplicas"] = readyReplicas
	resItem.Extra["availableReplicas"] = availableReplicas
	resItem.Extra["images"] = images
	resItem.Extra["initImages"] = initImages

	// Map revision for Deployment relationship
	if rev, ok := item.GetAnnotations()["deployment.kubernetes.io/revision"]; ok {
		resItem.Extra["revision"] = rev
	}

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *ReplicaSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
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
					mappedPod := podMgr.MapItem(pod, metricsMap)
					// Explicitly ensure node name is present
					if nodeName, ok, _ := unstructured.NestedString(pod.Object, "spec", "nodeName"); ok {
						mappedPod.Extra["node"] = nodeName
					}
					relatedPods = append(relatedPods, mappedPod)
					break
				}
			}
		}
		response["relatedPods"] = relatedPods
	}

	// Fetch related Services based on selector
	selector, found, _ := unstructured.NestedMap(item.Object, "spec", "selector", "matchLabels")
	if found {
		svcMgr := NewServiceManager()
		services, err := dynClient.Resource(svcMgr.GetGVR()).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
		if err == nil {
			var relatedServices []ResourceItem
			for _, svc := range services.Items {
				svcSelector, found, _ := unstructured.NestedMap(svc.Object, "spec", "selector")
				if found {
					// Check if Service selector is a subset of ReplicaSet selector
					isMatch := true
					for k, v := range svcSelector {
						if val, ok := selector[k]; !ok || val != v {
							isMatch = false
							break
						}
					}
					if isMatch && len(svcSelector) > 0 {
						relatedServices = append(relatedServices, svcMgr.MapItem(svc, nil))
					}
				}
			}
			response["relatedServices"] = relatedServices
		}
	}

	return response, nil
}
