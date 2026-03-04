package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	"k-view/pkg/utils"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// GenericManager serves as a fallback strategy for resources without specific logic.
type GenericManager struct {
	gvr           schema.GroupVersionResource
	clusterScoped bool
}

func NewGenericManager(gvr schema.GroupVersionResource, clusterScoped bool) *GenericManager {
	return &GenericManager{
		gvr:           gvr,
		clusterScoped: clusterScoped,
	}
}

func (m *GenericManager) GetGVR() schema.GroupVersionResource {
	return m.gvr
}

func (m *GenericManager) IsClusterScoped() bool {
	return m.clusterScoped
}

func (m *GenericManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	extra := make(map[string]interface{})
	
	labels, _, _ := unstructured.NestedMap(item.Object, "metadata", "labels")
	annotations, _, _ := unstructured.NestedMap(item.Object, "metadata", "annotations")
	
	extra["labels"] = labels
	extra["annotations"] = annotations
	extra["kind"] = item.GetKind()
	extra["uid"] = string(item.GetUID())

	if len(item.GetOwnerReferences()) > 0 {
		extra["owner-uid"] = string(item.GetOwnerReferences()[0].UID)
		extra["owner-name"] = item.GetOwnerReferences()[0].Name
	}

	return ResourceItem{
		Name:      item.GetName(),
		Namespace: item.GetNamespace(),
		Age:       utils.GetAge(item.GetCreationTimestamp().Time),
		Status:    "Active",
		Extra:     extra,
	}
}

func (m *GenericManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	// DTO Isolation: map specific fields, do not leak raw struct
	statusData, _, _ := unstructured.NestedMap(item.Object, "status")
	metaData, _, _ := unstructured.NestedMap(item.Object, "metadata")
	specData, _, _ := unstructured.NestedMap(item.Object, "spec")
	dataData, _, _ := unstructured.NestedMap(item.Object, "data")

	extra := make(map[string]interface{})
	extra["labels"] = k8sutils.GetLabels(item.Object)
	extra["annotations"] = k8sutils.GetAnnotations(item.Object)
	extra["kind"] = item.GetKind()

	response := gin.H{
		"resource": gin.H{
			"name":      item.GetName(),
			"namespace": item.GetNamespace(),
			"age":       utils.GetAge(item.GetCreationTimestamp().Time),
			"status":    statusData,
		},
		"metadata": metaData,
		"spec":     specData,
		"status":   statusData,
		"data":     dataData,
		"extra":    extra,
	}

	// For custom cluster-scoped resources with custom root fields
	for k, v := range item.Object {
		if k != "metadata" && k != "status" && k != "spec" && k != "kind" && k != "apiVersion" && k != "data" {
			response[k] = v
		}
	}

	return response, nil
}
