package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type StorageClassManager struct {
	GenericManager
}

func NewStorageClassManager() *StorageClassManager {
	return &StorageClassManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}, true),
	}
}

func (m *StorageClassManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	provisioner, _, _ := unstructured.NestedString(item.Object, "provisioner")
	reclaimPolicy, _, _ := unstructured.NestedString(item.Object, "reclaimPolicy")
	bindingMode, _, _ := unstructured.NestedString(item.Object, "volumeBindingMode")
	allowExpansion, _, _ := unstructured.NestedBool(item.Object, "allowVolumeExpansion")
	mountOptions, _, _ := unstructured.NestedStringSlice(item.Object, "mountOptions")
	parameters, _, _ := unstructured.NestedMap(item.Object, "parameters")

	resItem.Extra["provisioner"] = provisioner
	resItem.Extra["reclaimPolicy"] = reclaimPolicy
	resItem.Extra["volumeBindingMode"] = bindingMode
	resItem.Extra["allowVolumeExpansion"] = allowExpansion
	resItem.Extra["mountOptions"] = mountOptions
	resItem.Extra["parameters"] = parameters

	return resItem
}

func (m *StorageClassManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
