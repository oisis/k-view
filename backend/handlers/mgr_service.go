package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ServiceManager struct {
	GenericManager
}

func NewServiceManager() *ServiceManager {
	return &ServiceManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}, false),
	}
}

func (m *ServiceManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	clusterIP, _, _ := unstructured.NestedString(item.Object, "spec", "clusterIP")
	svcType, _, _ := unstructured.NestedString(item.Object, "spec", "type")

	resItem.Extra["clusterIP"] = clusterIP
	resItem.Extra["type"] = svcType

	return resItem
}

func (m *ServiceManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// Fetch related endpoints safely using the same user context
	endpointsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	epItem, err := dynClient.Resource(endpointsGVR).Namespace(item.GetNamespace()).Get(ctx, item.GetName(), metav1.GetOptions{})
	if err == nil && epItem != nil {
		// DTO isolation: extract subsets instead of returning raw item.Object
		subsets, _, _ := unstructured.NestedSlice(epItem.Object, "subsets")
		response["relatedEndpoints"] = gin.H{
			"subsets": subsets,
		}
	}

	return response, nil
}
