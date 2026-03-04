package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ConfigMapManager struct {
	GenericManager
}

func NewConfigMapManager() *ConfigMapManager {
	return &ConfigMapManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}, false),
	}
}

func (m *ConfigMapManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	data, _, _ := unstructured.NestedMap(item.Object, "data")
	binaryData, _, _ := unstructured.NestedMap(item.Object, "binaryData")
	
	var keys []string
	for k := range data {
		keys = append(keys, k)
	}
	for k := range binaryData {
		keys = append(keys, k)
	}

	resItem.Extra["keys"] = keys
	resItem.Extra["dataCount"] = len(keys)
	resItem.Status = "Ready"

	return resItem
}

func (m *ConfigMapManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
