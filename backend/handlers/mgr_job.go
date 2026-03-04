package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type JobManager struct {
	GenericManager
}

func NewJobManager() *JobManager {
	return &JobManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}, false),
	}
}

func (m *JobManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	completions, _, _ := unstructured.NestedInt64(item.Object, "spec", "completions")
	parallelism, _, _ := unstructured.NestedInt64(item.Object, "spec", "parallelism")
	activeDeadline, _, _ := unstructured.NestedInt64(item.Object, "spec", "activeDeadlineSeconds")
	
	succeeded, _, _ := unstructured.NestedInt64(item.Object, "status", "succeeded")
	failed, _, _ := unstructured.NestedInt64(item.Object, "status", "failed")
	active, _, _ := unstructured.NestedInt64(item.Object, "status", "active")

	resItem.Extra["completions"] = completions
	resItem.Extra["parallelism"] = parallelism
	resItem.Extra["activeDeadlineSeconds"] = activeDeadline
	resItem.Extra["succeeded"] = succeeded
	resItem.Extra["failed"] = failed
	resItem.Extra["active"] = active

	// Logic for job status
	if failed > 0 {
		resItem.Status = "Failed"
	} else if succeeded >= completions && completions > 0 {
		resItem.Status = "Succeeded"
	} else if active > 0 {
		resItem.Status = "Running"
	} else {
		resItem.Status = "Pending"
	}

	return resItem
}

func (m *JobManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
