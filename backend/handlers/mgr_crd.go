package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type CRDManager struct {
	GenericManager
}

func NewCRDManager() *CRDManager {
	return &CRDManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}, true),
	}
}

func (m *CRDManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	group, _, _ := unstructured.NestedString(item.Object, "spec", "group")
	scope, _, _ := unstructured.NestedString(item.Object, "spec", "scope")
	versions, _, _ := unstructured.NestedSlice(item.Object, "spec", "versions")
	
	var versionNames []string
	for _, v := range versions {
		if ver, ok := v.(map[string]interface{}); ok {
			if name, ok := ver["name"].(string); ok {
				versionNames = append(versionNames, name)
			}
		}
	}

	resItem.Extra["group"] = group
	resItem.Extra["scope"] = scope
	resItem.Extra["versions"] = versionNames
	resItem.Status = "Established"

	return resItem
}

func (m *CRDManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
