package k8sutils

import (
	"testing"
	"strings"
)

func TestGetLabels(t *testing.T) {
	obj := map[string]interface{}{
		"metadata": map[string]interface{}{
			"labels": map[string]interface{}{
				"app": "frontend",
				"env": "prod",
			},
		},
	}

	got := GetLabels(obj)
	if !strings.Contains(got, "app=frontend") || !strings.Contains(got, "env=prod") {
		t.Errorf("GetLabels() = %v, want to contain app=frontend and env=prod", got)
	}
}

func TestGetImages(t *testing.T) {
	// Mock Pod
	pod := map[string]interface{}{
		"spec": map[string]interface{}{
			"containers": []interface{}{
				map[string]interface{}{"image": "nginx:1.21"},
				map[string]interface{}{"image": "busybox"},
			},
		},
	}

	got := GetImages(pod)
	expected := "busybox, nginx:1.21"
	if got != expected {
		t.Errorf("GetImages() = %v, want %v", got, expected)
	}
}
