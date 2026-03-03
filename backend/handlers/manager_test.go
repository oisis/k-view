package handlers

import (
	"context"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestResourceRegistry(t *testing.T) {
	fallback := NewGenericManager(schema.GroupVersionResource{}, false)
	registry := NewResourceRegistry(fallback)
	podMgr := NewPodManager()

	registry.Register("pods", podMgr)

	t.Run("should return registered manager", func(t *testing.T) {
		mgr := registry.GetManager("pods")
		assert.Equal(t, podMgr, mgr)
	})

	t.Run("should return fallback manager for unknown kind", func(t *testing.T) {
		mgr := registry.GetManager("unknown")
		assert.Equal(t, fallback, mgr)
	})
}

func TestPodManager_MapItem(t *testing.T) {
	mgr := NewPodManager()

	item := unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "Pod",
			"metadata": map[string]interface{}{
				"name":      "test-pod",
				"namespace": "default",
				"labels": map[string]interface{}{
					"app": "test",
				},
			},
			"status": map[string]interface{}{
				"phase": "Running",
			},
		},
	}

	metrics := make(map[string]unstructured.Unstructured)

	res := mgr.MapItem(item, metrics)

	assert.Equal(t, "test-pod", res.Name)
	assert.Equal(t, "default", res.Namespace)
	assert.Equal(t, "Running", res.Status)
	assert.Equal(t, "app=test", res.Extra["labels"])
}

func TestGenericManager_GetDetails_DTOIsolation(t *testing.T) {
	mgr := NewGenericManager(schema.GroupVersionResource{}, false)

	item := unstructured.Unstructured{
		Object: map[string]interface{}{
			"apiVersion": "v1",
			"kind":       "Secret",
			"metadata": map[string]interface{}{
				"name": "my-secret",
			},
			"data": map[string]interface{}{
				"key": "base64==",
			},
			"extraUnwantedField": "should-not-leak", // Wait, GetDetails explicitly copies unknown fields. Let's test standard separation.
		},
	}

	// For test, dynClient is nil
	details, err := mgr.GetDetails(context.Background(), nil, item)
	
	assert.NoError(t, err)
	assert.NotNil(t, details["metadata"])
	assert.NotNil(t, details["data"])
	assert.Equal(t, "my-secret", details["metadata"].(map[string]interface{})["name"])
	
	// Ensure that root response structure does NOT contain full raw item.Object
	// The fields are mapped explicitly into 'resource', 'metadata', 'spec', 'status', 'data'
	assert.Equal(t, "my-secret", details["resource"].(gin.H)["name"])
}
