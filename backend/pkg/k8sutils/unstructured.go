package k8sutils

import (
	"strings"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// GetLabels returns labels as a comma-separated string from an unstructured object.
func GetLabels(obj map[string]interface{}) string {
	labels, ok, _ := unstructured.NestedMap(obj, "metadata", "labels")
	if !ok {
		return ""
	}
	var ls []string
	for k, v := range labels {
		if vs, ok := v.(string); ok {
			ls = append(ls, k+"="+vs)
		}
	}
	return strings.Join(ls, ", ")
}

// GetImages returns container images as a comma-separated string from an unstructured workload object.
func GetImages(obj map[string]interface{}) string {
	containers, ok, _ := unstructured.NestedSlice(obj, "spec", "template", "spec", "containers")
	if !ok {
		// Fallback for Pods where spec is at root
		containers, ok, _ = unstructured.NestedSlice(obj, "spec", "containers")
	}
	if !ok {
		return ""
	}
	var images []string
	for _, c := range containers {
		if container, ok := c.(map[string]interface{}); ok {
			if img, ok := container["image"].(string); ok {
				images = append(images, img)
			}
		}
	}
	return strings.Join(images, ", ")
}
