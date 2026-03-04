package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type DaemonSetManager struct {
	GenericManager
}

func NewDaemonSetManager() *DaemonSetManager {
	return &DaemonSetManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}, false),
	}
}

func (m *DaemonSetManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	desired, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredNumberScheduled")
	current, _, _ := unstructured.NestedInt64(item.Object, "status", "currentNumberScheduled")
	ready, _, _ := unstructured.NestedInt64(item.Object, "status", "numberReady")
	available, _, _ := unstructured.NestedInt64(item.Object, "status", "numberAvailable")
	updated, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedNumberScheduled")
	
	updateStrategy, _, _ := unstructured.NestedString(item.Object, "spec", "updateStrategy", "type")

	resItem.Extra["desired"] = desired
	resItem.Extra["current"] = current
	resItem.Extra["ready"] = ready
	resItem.Extra["available"] = available
	resItem.Extra["updated"] = updated
	resItem.Extra["updateStrategy"] = updateStrategy

	if ready < desired {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *DaemonSetManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
