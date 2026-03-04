package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type CronJobManager struct {
	GenericManager
}

func NewCronJobManager() *CronJobManager {
	return &CronJobManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}, false),
	}
}

func (m *CronJobManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	schedule, _, _ := unstructured.NestedString(item.Object, "spec", "schedule")
	suspend, _, _ := unstructured.NestedBool(item.Object, "spec", "suspend")
	concurrencyPolicy, _, _ := unstructured.NestedString(item.Object, "spec", "concurrencyPolicy")
	lastSchedule, _, _ := unstructured.NestedString(item.Object, "status", "lastScheduleTime")
	
	activeJobs, _, _ := unstructured.NestedSlice(item.Object, "status", "active")

	resItem.Extra["schedule"] = schedule
	resItem.Extra["suspend"] = suspend
	resItem.Extra["concurrencyPolicy"] = concurrencyPolicy
	resItem.Extra["lastScheduleTime"] = lastSchedule
	resItem.Extra["activeJobsCount"] = len(activeJobs)

	if suspend {
		resItem.Status = "Suspended"
	} else {
		resItem.Status = "Active"
	}

	return resItem
}

func (m *CronJobManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
