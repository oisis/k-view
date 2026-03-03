package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type DeploymentManager struct {
	GenericManager
}

func NewDeploymentManager() *DeploymentManager {
	return &DeploymentManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}, false),
	}
}

func (m *DeploymentManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	readyReplicas, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
	replicas, _, _ := unstructured.NestedInt64(item.Object, "spec", "replicas")

	resItem.Extra["readyReplicas"] = readyReplicas
	resItem.Extra["replicas"] = replicas

	if readyReplicas < replicas {
		resItem.Status = "Degraded"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *DeploymentManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	// Simple passthrough to generic for now, relying on its DTO extraction
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
