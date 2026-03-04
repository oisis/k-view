package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	group, _, _ := unstructured.NestedString(item.Object, "spec", "group")
	names, _, _ := unstructured.NestedMap(item.Object, "spec", "names")
	plural, _ := names["plural"].(string)
	
	// Try to find the first served version
	version := "v1"
	versions, ok, _ := unstructured.NestedSlice(item.Object, "spec", "versions")
	if ok && len(versions) > 0 {
		if vMap, ok := versions[0].(map[string]interface{}); ok {
			version = vMap["name"].(string)
		}
	}

	// Fetch instances of this CRD
	gvr := schema.GroupVersionResource{Group: group, Version: version, Resource: plural}
	list, err := dynClient.Resource(gvr).List(ctx, metav1.ListOptions{})
	if err == nil {
		var objects []ResourceItem
		for _, obj := range list.Items {
			objects = append(objects, m.GenericManager.MapItem(obj, nil))
		}
		response["relatedCrdObjects"] = objects
	}

	return response, nil
}
