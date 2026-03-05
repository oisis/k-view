package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ResourceQuotaManager struct {
	GenericManager
}

func NewResourceQuotaManager() *ResourceQuotaManager {
	return &ResourceQuotaManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "resourcequotas"}, false),
	}
}

func (m *ResourceQuotaManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	hard, _, _ := unstructured.NestedMap(item.Object, "status", "hard")
	used, _, _ := unstructured.NestedMap(item.Object, "status", "used")

	resItem.Extra["hard"] = hard
	resItem.Extra["used"] = used
	resItem.Status = "Active"

	return resItem
}

func (m *ResourceQuotaManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
