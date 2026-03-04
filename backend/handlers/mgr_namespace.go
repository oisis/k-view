package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type NamespaceManager struct {
	GenericManager
}

func NewNamespaceManager() *NamespaceManager {
	return &NamespaceManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}, true),
	}
}

func (m *NamespaceManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	resItem.Status = phase

	return resItem
}

func (m *NamespaceManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	name := item.GetName()

	// 1. Fetch ResourceQuotas
	quotaGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "resourcequotas"}
	quotas, err := dynClient.Resource(quotaGVR).Namespace(name).List(ctx, metav1.ListOptions{})
	if err == nil {
		response["quotas"] = quotas.Items
	}

	// 2. Fetch LimitRanges
	limitGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "limitranges"}
	limits, err := dynClient.Resource(limitGVR).Namespace(name).List(ctx, metav1.ListOptions{})
	if err == nil {
		response["limits"] = limits.Items
	}

	return response, nil
}
