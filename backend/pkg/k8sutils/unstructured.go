package k8sutils

import (
	"fmt"
	"sort"
	"strings"
	"time"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// ParseK8sTime parses RFC3339 time string to time.Time
func ParseK8sTime(t string) time.Time {
	// Try multiple common K8s time formats
	for _, format := range []string{time.RFC3339, "2006-01-02T15:04:05Z"} {
		parsed, err := time.Parse(format, t)
		if err == nil {
			return parsed
		}
	}
	return time.Now()
}

// GetLabels returns alphabetically sorted labels as a comma-separated string from an unstructured object.
func GetLabels(obj map[string]interface{}) string {
	labels, ok, _ := unstructured.NestedMap(obj, "metadata", "labels")
	if !ok {
		return ""
	}
	var ls []string
	for k, v := range labels {
		ls = append(ls, fmt.Sprintf("%s=%v", k, v))
	}
	sort.Strings(ls)
	return strings.Join(ls, ", ")
}

// GetAnnotations returns alphabetically sorted annotations as a comma-separated string from an unstructured object.
func GetAnnotations(obj map[string]interface{}) string {
	annotations, ok, _ := unstructured.NestedMap(obj, "metadata", "annotations")
	if !ok {
		return ""
	}
	var ls []string
	for k, v := range annotations {
		ls = append(ls, fmt.Sprintf("%s=%v", k, v))
	}
	sort.Strings(ls)
	return strings.Join(ls, ", ")
}

// GetImages returns container images as a comma-separated string from an unstructured workload object.
func GetImages(obj map[string]interface{}) string {
	var containers []interface{}
	var ok bool

	// CronJob nesting
	if jobTemplate, found, _ := unstructured.NestedMap(obj, "spec", "jobTemplate"); found {
		containers, ok, _ = unstructured.NestedSlice(jobTemplate, "spec", "template", "spec", "containers")
	} else {
		// Standard workload (Deployment, StatefulSet, DaemonSet, Job)
		containers, ok, _ = unstructured.NestedSlice(obj, "spec", "template", "spec", "containers")
		if !ok {
			// Pod direct spec
			containers, ok, _ = unstructured.NestedSlice(obj, "spec", "containers")
		}
	}

	if !ok || len(containers) == 0 {
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
