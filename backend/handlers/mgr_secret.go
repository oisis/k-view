package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type SecretManager struct {
	GenericManager
}

func NewSecretManager() *SecretManager {
	return &SecretManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}, false),
	}
}

func (m *SecretManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	secretType, _, _ := unstructured.NestedString(item.Object, "type")
	data, _, _ := unstructured.NestedMap(item.Object, "data")
	
	var keys []string
	for k := range data {
		keys = append(keys, k)
	}

	resItem.Extra["type"] = secretType
	resItem.Extra["keys"] = keys
	resItem.Extra["dataCount"] = len(keys)
	resItem.Status = "Ready"

	return resItem
}

func (m *SecretManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
