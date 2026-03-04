package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ServiceAccountManager struct {
	GenericManager
}

func NewServiceAccountManager() *ServiceAccountManager {
	return &ServiceAccountManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}, false),
	}
}

func (m *ServiceAccountManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	secrets, _, _ := unstructured.NestedSlice(item.Object, "secrets")
	imagePullSecrets, _, _ := unstructured.NestedSlice(item.Object, "imagePullSecrets")
	
	var secretNames []string
	for _, s := range secrets {
		if sec, ok := s.(map[string]interface{}); ok {
			if name, ok := sec["name"].(string); ok {
				secretNames = append(secretNames, name)
			}
		}
	}

	var imagePullSecretNames []string
	for _, s := range imagePullSecrets {
		if sec, ok := s.(map[string]interface{}); ok {
			if name, ok := sec["name"].(string); ok {
				imagePullSecretNames = append(imagePullSecretNames, name)
			}
		}
	}

	resItem.Extra["secrets"] = secretNames
	resItem.Extra["imagePullSecrets"] = imagePullSecretNames
	resItem.Extra["secretsCount"] = len(secretNames)
	resItem.Status = "Active"

	return resItem
}

func (m *ServiceAccountManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
