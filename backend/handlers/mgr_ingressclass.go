package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type IngressClassManager struct {
	GenericManager
}

func NewIngressClassManager() *IngressClassManager {
	return &IngressClassManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}, true),
	}
}

func (m *IngressClassManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	controller, _, _ := unstructured.NestedString(item.Object, "spec", "controller")
	resItem.Extra["controller"] = controller

	return resItem
}

func (m *IngressClassManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
