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
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	// 1. Extract detailed Capacity Info
	capacity, _, _ := unstructured.NestedMap(item.Object, "spec", "capacity")
	var capacityList []gin.H
	for k, v := range capacity {
		capacityList = append(capacityList, gin.H{
			"resourceName": k,
			"quantity":     v,
		})
	}
	response["detailedCapacity"] = capacityList

	// 2. Extract Volume Source Info
	spec, ok := item.Object["spec"].(map[string]interface{})
	if ok {
		// Identify which source type is used (csi, nfs, hostPath, etc)
		var sourceInfo gin.H
		if csi, ok, _ := unstructured.NestedMap(spec, "csi"); ok {
			sourceInfo = gin.H{
				"type":           "CSI",
				"driver":         csi["driver"],
				"volumeHandle":   csi["volumeHandle"],
				"attributes":     csi["volumeAttributes"],
			}
		} else if nfs, ok, _ := unstructured.NestedMap(spec, "nfs"); ok {
			sourceInfo = gin.H{
				"type":   "NFS",
				"server": nfs["server"],
				"path":   nfs["path"],
			}
		} else if hp, ok, _ := unstructured.NestedMap(spec, "hostPath"); ok {
			sourceInfo = gin.H{
				"type": "HostPath",
				"path": hp["path"],
			}
		}
		response["volumeSource"] = sourceInfo
	}

	return response, nil
}
