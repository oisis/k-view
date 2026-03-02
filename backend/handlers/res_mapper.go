package handlers

import (
	"strings"

	"k-view/pkg/k8sutils"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapResourceSpecifics(item unstructured.Unstructured, kind string, resItem *ResourceItem) {
	if resItem.Extra == nil {
		resItem.Extra = make(map[string]string)
	}

	resItem.Extra["labels"] = k8sutils.GetLabels(item.Object)
	resItem.Extra["annotations"] = k8sutils.GetAnnotations(item.Object)
	resItem.Extra["kind"] = item.GetKind()

	if len(item.GetOwnerReferences()) > 0 {
		resItem.Extra["owner-uid"] = string(item.GetOwnerReferences()[0].UID)
	}

	kind = strings.ToLower(kind)
	switch kind {
	case "pods", "pod", "deployments", "deployment", "statefulsets", "statefulset", "daemonsets", "daemonset", "jobs", "job", "cronjobs", "cronjob", "replicasets", "replicaset", "replicationcontrollers", "hpas", "horizontalpodautoscalers":
		h.mapWorkload(item, kind, resItem.Extra, resItem)
	case "services", "service", "ingresses", "ingress", "ingress-classes", "ingressclass", "network-policies", "networkpolicy":
		h.mapNetwork(item, kind, resItem.Extra, resItem, nil)
	case "persistentvolumeclaims", "pvcs", "persistentvolumes", "pvs", "storage-classes", "storageclass", "secrets", "secret":
		h.mapStorage(item, kind, resItem.Extra, resItem)
	case "crds", "customresourcedefinitions":
		h.mapCRD(item, resItem.Extra, resItem)
	}
}

func (h *ResourceHandler) mapCRD(item unstructured.Unstructured, extra map[string]string, resItem *ResourceItem) {
	if group, ok, _ := unstructured.NestedString(item.Object, "spec", "group"); ok {
		extra["group"] = group
	}
	if scope, ok, _ := unstructured.NestedString(item.Object, "spec", "scope"); ok {
		extra["scope"] = scope
	}
	if versions, ok, _ := unstructured.NestedSlice(item.Object, "spec", "versions"); ok && len(versions) > 0 {
		var vs []string
		for _, v := range versions {
			if vm, ok := v.(map[string]interface{}); ok {
				if name, ok := vm["name"].(string); ok {
					vs = append(vs, name)
				}
			}
		}
		extra["version"] = strings.Join(vs, ", ")
	}

	if conds, ok, _ := unstructured.NestedSlice(item.Object, "status", "conditions"); ok {
		for _, c := range conds {
			if cm, ok := c.(map[string]interface{}); ok {
				if cType, ok := cm["type"].(string); ok && cType == "Established" {
					if status, ok := cm["status"].(string); ok && status == "True" {
						resItem.Status = "Established"
					}
				}
			}
		}
	}
}
