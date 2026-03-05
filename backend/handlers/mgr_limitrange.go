package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type LimitRangeManager struct {
	GenericManager
}

func NewLimitRangeManager() *LimitRangeManager {
	return &LimitRangeManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "limitranges"}, false),
	}
}

func (m *LimitRangeManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	limits, _, _ := unstructured.NestedSlice(item.Object, "spec", "limits")
	resItem.Extra["limits"] = limits
	resItem.Status = "Active"

	return resItem
}

func (m *LimitRangeManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
