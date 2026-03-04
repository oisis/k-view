package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type EventManager struct {
	GenericManager
}

func NewEventManager() *EventManager {
	return &EventManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}, false),
	}
}

func (m *EventManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	eventType, _, _ := unstructured.NestedString(item.Object, "type")
	reason, _, _ := unstructured.NestedString(item.Object, "reason")
	message, _, _ := unstructured.NestedString(item.Object, "message")
	count, _, _ := unstructured.NestedInt64(item.Object, "count")
	
	involvedKind, _, _ := unstructured.NestedString(item.Object, "involvedObject", "kind")
	involvedName, _, _ := unstructured.NestedString(item.Object, "involvedObject", "name")

	resItem.Extra["type"] = eventType
	resItem.Extra["reason"] = reason
	resItem.Extra["message"] = message
	resItem.Extra["count"] = count
	resItem.Extra["involvedObject"] = involvedKind + "/" + involvedName
	
	resItem.Status = eventType

	return resItem
}

func (m *EventManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
