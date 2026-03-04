package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
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
	
	statusPhase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	resItem.Status = statusPhase

	nodeName, _, _ := unstructured.NestedString(item.Object, "spec", "nodeName")
	podIP, _, _ := unstructured.NestedString(item.Object, "status", "podIP")
	hostIP, _, _ := unstructured.NestedString(item.Object, "status", "hostIP")

	resItem.Extra["nodeName"] = nodeName
	resItem.Extra["podIP"] = podIP
	resItem.Extra["hostIP"] = hostIP

	// Extract images from spec
	var images []string
	if containers, ok, _ := unstructured.NestedSlice(item.Object, "spec", "containers"); ok {
		for _, c := range containers {
			if cmap, ok := c.(map[string]interface{}); ok {
				if img, ok := cmap["image"].(string); ok {
					images = append(images, img)
				}
			}
		}
	}
	resItem.Extra["images"] = images

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

	return resItem
}

func (m *PodManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// 1. Controlled By (Owners with full DTO info)
	owners := item.GetOwnerReferences()
	var controlledBy []ResourceItem
	for _, owner := range owners {
		gvr := getGVR(owner.Kind)
		if gvr.Resource != "" {
			ownerItem, err := dynClient.Resource(gvr).Namespace(item.GetNamespace()).Get(ctx, owner.Name, metav1.GetOptions{})
			if err == nil {
				// Map using specialized managers to get all fields like images and readyReplicas
				var mapped ResourceItem
				switch owner.Kind {
				case "ReplicaSet":
					mapped = NewReplicaSetManager().MapItem(*ownerItem, nil)
				case "Job":
					mapped = NewJobManager().MapItem(*ownerItem, nil)
				case "StatefulSet":
					mapped = NewStatefulSetManager().MapItem(*ownerItem, nil)
				case "DaemonSet":
					mapped = NewDaemonSetManager().MapItem(*ownerItem, nil)
				case "Deployment":
					mapped = NewDeploymentManager().MapItem(*ownerItem, nil)
				default:
					mapped = m.GenericManager.MapItem(*ownerItem, nil)
				}
				controlledBy = append(controlledBy, mapped)
			}
		}
	}
	response["controlledBy"] = controlledBy

	// 2. Containers Info (Full Spec details)
	var containers []gin.H
	if specs, ok, _ := unstructured.NestedSlice(item.Object, "spec", "containers"); ok {
		for _, s := range specs {
			if c, ok := s.(map[string]interface{}); ok {
				name, _ := c["name"].(string)
				
				// Status info
				var ready, started bool
				var stateReason string
				if statuses, ok, _ := unstructured.NestedSlice(item.Object, "status", "containerStatuses"); ok {
					for _, st := range statuses {
						if stMap, ok := st.(map[string]interface{}); ok && stMap["name"] == name {
							ready, _ = stMap["ready"].(bool)
							started, _ = stMap["started"].(bool)
							if state, ok := stMap["state"].(map[string]interface{}); ok {
								for _, v := range state {
									if vMap, ok := v.(map[string]interface{}); ok {
										stateReason, _ = vMap["reason"].(string)
									}
								}
							}
						}
					}
				}

				containers = append(containers, gin.H{
					"name":           name,
					"image":          c["image"],
					"ready":          ready,
					"started":        started,
					"stateReason":    stateReason,
					"env":            c["env"],
					"volumeMounts":   c["volumeMounts"],
					"livenessProbe":  c["livenessProbe"],
					"readinessProbe": c["readinessProbe"],
				})
			}
		}
	}
	response["containers"] = containers

	// 3. Related PVCs (Full DTOs)
	pvcMgr := NewPVCManager()
	var relatedPvcs []ResourceItem
	if volumes, ok, _ := unstructured.NestedSlice(item.Object, "spec", "volumes"); ok {
		for _, v := range volumes {
			if vMap, ok := v.(map[string]interface{}); ok {
				if pvc, ok, _ := unstructured.NestedMap(vMap, "persistentVolumeClaim"); ok {
					if name, ok := pvc["claimName"].(string); ok {
						pvcItem, err := dynClient.Resource(pvcMgr.GetGVR()).Namespace(item.GetNamespace()).Get(ctx, name, metav1.GetOptions{})
						if err == nil {
							relatedPvcs = append(relatedPvcs, pvcMgr.MapItem(*pvcItem, nil))
						}
					}
				}
			}
		}
	}
	response["relatedPvcs"] = relatedPvcs

	return response, nil
}
