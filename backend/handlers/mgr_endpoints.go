package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type EndpointsManager struct {
	GenericManager
}

func NewEndpointsManager() *EndpointsManager {
	return &EndpointsManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}, false),
	}
}

func (m *EndpointsManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	subsets, _, _ := unstructured.NestedSlice(item.Object, "subsets")
	
	var ips []string
	for _, s := range subsets {
		if subset, ok := s.(map[string]interface{}); ok {
			if addresses, ok := subset["addresses"].([]interface{}); ok {
				for _, addr := range addresses {
					if a, ok := addr.(map[string]interface{}); ok {
						if ip, ok := a["ip"].(string); ok {
							ips = append(ips, ip)
						}
					}
				}
			}
		}
	}

	resItem.Extra["ips"] = ips
	resItem.Extra["endpointsCount"] = len(ips)
	resItem.Status = "Active"

	return resItem
}

func (m *EndpointsManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
