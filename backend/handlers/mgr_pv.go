package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type PVManager struct {
	GenericManager
}

func NewPVManager() *PVManager {
	return &PVManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}, true),
	}
}

func (m *PVManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	capacity, _, _ := unstructured.NestedMap(item.Object, "spec", "capacity")
	storage, _ := capacity["storage"].(string)
	
	accessModes, _, _ := unstructured.NestedStringSlice(item.Object, "spec", "accessModes")
	reclaimPolicy, _, _ := unstructured.NestedString(item.Object, "spec", "persistentVolumeReclaimPolicy")
	storageClass, _, _ := unstructured.NestedString(item.Object, "spec", "storageClassName")
	
	claimRefName, _, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "name")
	claimRefNamespace, _, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "namespace")
	
	phase, _, _ := unstructured.NestedString(item.Object, "status", "phase")
	reason, _, _ := unstructured.NestedString(item.Object, "status", "reason")

	resItem.Extra["capacity"] = storage
	resItem.Extra["accessModes"] = accessModes
	resItem.Extra["reclaimPolicy"] = reclaimPolicy
	resItem.Extra["storageClass"] = storageClass
	resItem.Extra["claimRef"] = claimRefNamespace + "/" + claimRefName
	resItem.Extra["reason"] = reason
	resItem.Status = phase

	return resItem
}

func (m *PVManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
