package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
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

	resItem.Extra["replicas"] = replicas
	resItem.Extra["readyReplicas"] = readyReplicas
	resItem.Extra["currentReplicas"] = currentReplicas
	resItem.Extra["updatedReplicas"] = updatedReplicas
	resItem.Extra["updateStrategy"] = updateStrategy
	resItem.Extra["serviceName"] = serviceName

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *StatefulSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
