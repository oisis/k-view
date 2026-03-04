package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type RoleBindingManager struct {
	GenericManager
}

func NewRoleBindingManager() *RoleBindingManager {
	return &RoleBindingManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}, false),
	}
}

func (m *RoleBindingManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	roleRef, _, _ := unstructured.NestedMap(item.Object, "roleRef")
	subjects, _, _ := unstructured.NestedSlice(item.Object, "subjects")

	resItem.Extra["roleRef"] = roleRef
	resItem.Extra["subjects"] = subjects
	resItem.Extra["subjectsCount"] = len(subjects)
	resItem.Status = "Active"

	return resItem
}

func (m *RoleBindingManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
