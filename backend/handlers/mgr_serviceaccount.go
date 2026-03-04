package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	ns := item.GetNamespace()

	// Fetch related Secrets
	secretMgr := NewSecretManager()
	var relatedSecrets []ResourceItem
	if secrets, ok, _ := unstructured.NestedSlice(item.Object, "secrets"); ok {
		for _, s := range secrets {
			if sMap, ok := s.(map[string]interface{}); ok {
				name, _ := sMap["name"].(string)
				secretItem, err := dynClient.Resource(secretMgr.GetGVR()).Namespace(ns).Get(ctx, name, metav1.GetOptions{})
				if err == nil {
					relatedSecrets = append(relatedSecrets, secretMgr.MapItem(*secretItem, nil))
				}
			}
		}
	}
	response["relatedSecrets"] = relatedSecrets

	return response, nil
}
