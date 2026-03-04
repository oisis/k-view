package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type PVCManager struct {
	GenericManager
}

func NewPVCManager() *PVCManager {
	return &PVCManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}, false),
	}
}

func (m *PVCManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	storageClass, _, _ := unstructured.NestedString(item.Object, "spec", "storageClassName")
	volumeName, _, _ := unstructured.NestedString(item.Object, "spec", "volumeName")
	accessModes, _, _ := unstructured.NestedStringSlice(item.Object, "spec", "accessModes")
	
	capacity, _, _ := unstructured.NestedMap(item.Object, "status", "capacity")
	storage, _ := capacity["storage"].(string)
	
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")

	resItem.Extra["storageClass"] = storageClass
	resItem.Extra["volumeName"] = volumeName
	resItem.Extra["accessModes"] = accessModes
	resItem.Extra["capacity"] = storage
	resItem.Status = phase

	return resItem
}

func (m *PVCManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
