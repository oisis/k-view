package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type HPAManager struct {
	GenericManager
}

func NewHPAManager() *HPAManager {
	return &HPAManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}, false),
	}
}

func (m *HPAManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	targetKind, _, _ := unstructured.NestedString(item.Object, "spec", "scaleTargetRef", "kind")
	targetName, _, _ := unstructured.NestedString(item.Object, "spec", "scaleTargetRef", "name")
	
	minReplicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "minReplicas")
	maxReplicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "maxReplicas")
	
	currentReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "currentReplicas")
	desiredReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredReplicas")

	resItem.Extra["reference"] = targetKind + "/" + targetName
	resItem.Extra["minReplicas"] = minReplicas
	resItem.Extra["maxReplicas"] = maxReplicas
	resItem.Extra["currentReplicas"] = currentReplicas
	resItem.Extra["desiredReplicas"] = desiredReplicas
	
	resItem.Status = "Active"

	return resItem
}

func (m *HPAManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
