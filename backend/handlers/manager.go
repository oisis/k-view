package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

// ResourceManager defines the strategy for handling specific K8s resources
type ResourceManager interface {
	GetGVR() schema.GroupVersionResource
	IsClusterScoped() bool
	MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem
	GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error)
}

// ResourceRegistry manages available resource strategies
type ResourceRegistry struct {
	managers map[string]ResourceManager
	fallback ResourceManager
}

// NewResourceRegistry creates a new registry with a fallback generic manager
func NewResourceRegistry(fallback ResourceManager) *ResourceRegistry {
	return &ResourceRegistry{
		managers: make(map[string]ResourceManager),
		fallback: fallback,
	}
}

// Register adds a manager strategy for a specific resource kind
func (r *ResourceRegistry) Register(kind string, manager ResourceManager) {
	r.managers[kind] = manager
}

// GetManager retrieves the manager for a kind, or fallback if not found
func (r *ResourceRegistry) GetManager(kind string) ResourceManager {
	if mgr, ok := r.managers[kind]; ok {
		return mgr
	}
	return r.fallback
}
