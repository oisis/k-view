package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ClusterRoleManager struct {
	GenericManager
}

func NewClusterRoleManager() *ClusterRoleManager {
	return &ClusterRoleManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}, true),
	}
}

func (m *ClusterRoleManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	rules, _, _ := unstructured.NestedSlice(item.Object, "rules")
	resItem.Extra["rulesCount"] = len(rules)
	resItem.Extra["rules"] = rules
	resItem.Status = "Active"

	return resItem
}

func (m *ClusterRoleManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
