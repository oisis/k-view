package handlers

import (
	"testing"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestMapping(t *testing.T) {
	h := &ResourceHandler{}

	t.Run("Pod Mapping", func(t *testing.T) {
		pod := unstructured.Unstructured{
			Object: map[string]interface{}{
				"kind": "Pod",
				"metadata": map[string]interface{}{
					"name":      "test-pod",
					"namespace": "default",
				},
				"status": map[string]interface{}{
					"phase": "Running",
				},
			},
		}

		res := &ResourceItem{Extra: make(map[string]interface{})}
		h.mapResourceSpecifics(pod, "pods", res)

		if res.Status != "Running" {
			t.Errorf("Expected status Running, got %s", res.Status)
		}
	})

	t.Run("Service Mapping", func(t *testing.T) {
		svc := unstructured.Unstructured{
			Object: map[string]interface{}{
				"kind": "Service",
				"metadata": map[string]interface{}{
					"name": "test-svc",
				},
				"spec": map[string]interface{}{
					"type":      "ClusterIP",
					"clusterIP": "10.0.0.1",
				},
			},
		}

		res := &ResourceItem{Extra: make(map[string]interface{})}
		h.mapResourceSpecifics(svc, "services", res)

		if res.Status != "ClusterIP" {
			t.Errorf("Expected status ClusterIP, got %s", res.Status)
		}
		if res.Extra["cluster-ip"] != "10.0.0.1" {
			t.Errorf("Expected cluster-ip 10.0.0.1, got %v", res.Extra["cluster-ip"])
		}
	})
}
