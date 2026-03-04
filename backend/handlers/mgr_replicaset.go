package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
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

	resItem.Extra["replicas"] = replicas
	resItem.Extra["fullyLabeledReplicas"] = fullyLabeledReplicas
	resItem.Extra["readyReplicas"] = readyReplicas
	resItem.Extra["availableReplicas"] = availableReplicas

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *ReplicaSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
