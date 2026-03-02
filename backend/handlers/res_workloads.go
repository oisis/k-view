package handlers

import (
	"fmt"
	"strings"

	"k-view/pkg/k8sutils"
	"k-view/pkg/utils"

	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapWorkload(item unstructured.Unstructured, kind string, extra map[string]string, resItem *ResourceItem) {
	// Common for all workloads: extract images and labels
	if kind != "nodes" && kind != "namespaces" {
		if imgs := k8sutils.GetImages(item.Object); imgs != "" {
			extra["images"] = imgs
		}
		if lbls := k8sutils.GetLabels(item.Object); lbls != "" {
			extra["labels"] = lbls
		}
	}

	kind = strings.ToLower(kind)
	switch kind {
	case "pods", "pod":
		if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
			resItem.Status = phase
		}
		node, _, _ := unstructured.NestedString(item.Object, "spec", "nodeName")
		extra["node"] = node

		if containerStatuses, ok, _ := unstructured.NestedSlice(item.Object, "status", "containerStatuses"); ok {
			readyCount := 0
			restartCount := int64(0)
			for _, cs := range containerStatuses {
				if s, ok := cs.(map[string]interface{}); ok {
					if ready, ok := s["ready"].(bool); ok && ready {
						readyCount++
					}
					if rc, ok := s["restartCount"].(int64); ok {
						restartCount += rc
					} else if rcFloat, ok := s["restartCount"].(float64); ok {
						restartCount += int64(rcFloat)
					}
				}
			}
			extra["ready"] = fmt.Sprintf("%d/%d", readyCount, len(containerStatuses))
			extra["restarts"] = fmt.Sprintf("%d", restartCount)
		}

		if containers, ok, _ := unstructured.NestedSlice(item.Object, "spec", "containers"); ok && len(containers) > 0 {
			var totalCPU, totalMem int64
			for _, c := range containers {
				if container, ok := c.(map[string]interface{}); ok {
					if res, ok := container["resources"].(map[string]interface{}); ok {
						if reqs, ok := res["requests"].(map[string]interface{}); ok {
							if cpu, ok := reqs["cpu"].(string); ok {
								if q, err := resource.ParseQuantity(cpu); err == nil {
									totalCPU += q.MilliValue()
								}
							}
							if mem, ok := reqs["memory"].(string); ok {
								if q, err := resource.ParseQuantity(mem); err == nil {
									totalMem += q.Value() / (1024 * 1024)
								}
							}
						}
					}
				}
			}
			if totalCPU > 0 { extra["cpu"] = fmt.Sprintf("%dm", totalCPU) }
			if totalMem > 0 { extra["ram"] = fmt.Sprintf("%dMi", totalMem) }
		}

	case "deployments", "deployment":
		replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
		ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
		avail, _, _ := unstructured.NestedInt64(item.Object, "status", "availableReplicas")
		up, _, _ := unstructured.NestedInt64(item.Object, "status", "updatedReplicas")
		extra["ready"] = fmt.Sprintf("%d/%d", ready, replicas)
		extra["available"] = fmt.Sprintf("%d", avail)
		extra["up-to-date"] = fmt.Sprintf("%d", up)

	case "statefulsets", "statefulset":
		replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
		ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
		extra["ready"] = fmt.Sprintf("%d/%d", ready, replicas)
		extra["replicas"] = fmt.Sprintf("%d", replicas)

	case "daemonsets", "daemonset":
		desired, _, _ := unstructured.NestedInt64(item.Object, "status", "desiredNumberScheduled")
		ready, _, _ := unstructured.NestedInt64(item.Object, "status", "numberReady")
		extra["desired"] = fmt.Sprintf("%d", desired)
		extra["ready"] = fmt.Sprintf("%d", ready)
		extra["pods"] = fmt.Sprintf("%d/%d", ready, desired)

	case "cronjobs", "cronjob":
		schedule, _, _ := unstructured.NestedString(item.Object, "spec", "schedule")
		extra["schedule"] = schedule
		if suspend, ok, _ := unstructured.NestedBool(item.Object, "spec", "suspend"); ok {
			extra["suspend"] = fmt.Sprintf("%v", suspend)
		}
		if lastSchedule, ok, _ := unstructured.NestedString(item.Object, "status", "lastScheduleTime"); ok {
			extra["last-schedule"] = utils.GetAge(utils.ParseK8sTime(lastSchedule))
		}

	case "jobs", "job":
		active, _, _ := unstructured.NestedInt64(item.Object, "status", "active")
		succeeded, _, _ := unstructured.NestedInt64(item.Object, "status", "succeeded")
		failed, _, _ := unstructured.NestedInt64(item.Object, "status", "failed")
		completions, found, _ := unstructured.NestedInt64(item.Object, "spec", "completions")
		if !found { completions = 1 }
		extra["pods"] = fmt.Sprintf("%d/%d", succeeded, completions)
		extra["active"] = fmt.Sprintf("%d", active)
		extra["succeeded"] = fmt.Sprintf("%d", succeeded)
		extra["failed"] = fmt.Sprintf("%d", failed)

	case "replicasets", "replicaset":
		if rev, ok, _ := k8sutils.GetAnnotation(item.Object, "deployment.kubernetes.io/revision"); ok {
			extra["revision"] = rev
		}
		ready, _, _ := unstructured.NestedInt64(item.Object, "status", "readyReplicas")
		replicas, _, _ := unstructured.NestedInt64(item.Object, "status", "replicas")
		extra["pods"] = fmt.Sprintf("%d/%d", ready, replicas)
	}
}
