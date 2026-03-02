package k8sutils

import (
	"fmt"
	"sort"
	"strings"
	"strconv"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// GetLabels extracts and sorts labels into a comma-separated string
func GetLabels(obj map[string]interface{}) string {
	metadata, ok := obj["metadata"].(map[string]interface{})
	if !ok { return "" }
	labels, ok := metadata["labels"].(map[string]interface{})
	if !ok { return "" }

	var res []string
	for k, v := range labels {
		res = append(res, fmt.Sprintf("%s=%v", k, v))
	}
	sort.Strings(res)
	return strings.Join(res, ", ")
}

// GetAnnotations extracts and sorts annotations into a comma-separated string
func GetAnnotations(obj map[string]interface{}) string {
	metadata, ok := obj["metadata"].(map[string]interface{})
	if !ok { return "" }
	ann, ok := metadata["annotations"].(map[string]interface{})
	if !ok { return "" }

	var res []string
	for k, v := range ann {
		res = append(res, fmt.Sprintf("%s=%v", k, v))
	}
	sort.Strings(res)
	return strings.Join(res, ", ")
}

// GetAnnotation extracts a single annotation by key
func GetAnnotation(obj map[string]interface{}, key string) (string, bool, error) {
	metadata, ok := obj["metadata"].(map[string]interface{})
	if !ok { return "", false, nil }
	ann, ok := metadata["annotations"].(map[string]interface{})
	if !ok { return "", false, nil }

	val, ok := ann[key]
	if !ok { return "", false, nil }
	
	s, ok := val.(string)
	if !ok { return fmt.Sprintf("%v", val), true, nil }
	return s, true, nil
}

// GetImages extracts container images from a pod or workload spec
func GetImages(obj map[string]interface{}) string {
	var containers []interface{}
	
	// Pod
	if c, ok, _ := unstructured.NestedSlice(obj, "spec", "containers"); ok {
		containers = c
	} else if c, ok, _ := unstructured.NestedSlice(obj, "spec", "template", "spec", "containers"); ok {
		// Deployment/StatefulSet/DaemonSet/Job
		containers = c
	} else if c, ok, _ := unstructured.NestedSlice(obj, "spec", "jobTemplate", "spec", "template", "spec", "containers"); ok {
		// CronJob
		containers = c
	}

	var images []string
	for _, c := range containers {
		if container, ok := c.(map[string]interface{}); ok {
			if img, ok := container["image"].(string); ok {
				images = append(images, img)
			}
		}
	}
	
	sort.Strings(images)
	return strings.Join(images, ", ")
}

// ParseCPU converts K8s CPU quantity to float64 cores
func ParseCPU(val interface{}) float64 {
	if val == nil { return 0 }
	s := fmt.Sprintf("%v", val)
	q, err := resource.ParseQuantity(s)
	if err != nil { return 0 }
	return float64(q.MilliValue()) / 1000.0
}

// ParseMemory converts K8s memory quantity to float64 bytes
func ParseMemory(val interface{}) float64 {
	if val == nil { return 0 }
	s := fmt.Sprintf("%v", val)
	q, err := resource.ParseQuantity(s)
	if err != nil { return 0 }
	return float64(q.Value())
}

// ParseQuantity converts a generic K8s quantity to float64
func ParseQuantity(val interface{}) float64 {
	if val == nil { return 0 }
	s := fmt.Sprintf("%v", val)
	q, err := resource.ParseQuantity(s)
	if err != nil {
		f, _ := strconv.ParseFloat(s, 64)
		return f
	}
	return float64(q.Value())
}
