package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type DeploymentManager struct {
	GenericManager
}

func NewDeploymentManager() *DeploymentManager {
	return &DeploymentManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}, false),
	}
}

func (m *DeploymentManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")
	readyReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
	updatedReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedReplicas")
	availableReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")
	
	updateStrategy, _, _ := unstructured.NestedString(item.Object, "spec", "strategy", "type")

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
	resItem.Extra["updatedReplicas"] = updatedReplicas
	resItem.Extra["availableReplicas"] = availableReplicas
	resItem.Extra["updateStrategy"] = updateStrategy
	resItem.Extra["images"] = images

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *DeploymentManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// Fetch and Map related HPAs
	hpaMgr := NewHPAManager()
	hpaGVR := hpaMgr.GetGVR()
	hpas, err := dynClient.Resource(hpaGVR).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
	if err == nil {
		var relatedHpas []ResourceItem
		for _, hpa := range hpas.Items {
			targetKind, _, _ := unstructured.NestedString(hpa.Object, "spec", "scaleTargetRef", "kind")
			targetName, _, _ := unstructured.NestedString(hpa.Object, "spec", "scaleTargetRef", "name")
			// Case-insensitive match for Deployment kind
			if (targetKind == "Deployment" || targetKind == "deployment") && targetName == item.GetName() {
				relatedHpas = append(relatedHpas, hpaMgr.MapItem(hpa, nil))
			}
		}
		response["relatedHpas"] = relatedHpas
	}

	// Fetch and Map related ReplicaSets
	rsMgr := NewReplicaSetManager()
	rsGVR := rsMgr.GetGVR()
	rss, err := dynClient.Resource(rsGVR).Namespace(item.GetNamespace()).List(ctx, metav1.ListOptions{})
	if err == nil {
		var relatedRS []ResourceItem
		for _, rs := range rss.Items {
			// Check ownership by UID
			isOwner := false
			for _, owner := range rs.GetOwnerReferences() {
				if owner.UID == item.GetUID() {
					isOwner = true
					break
				}
			}
			if isOwner {
				relatedRS = append(relatedRS, rsMgr.MapItem(rs, nil))
			}
		}
		response["relatedReplicaSets"] = relatedRS
	}

	return response, nil
}
