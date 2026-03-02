package handlers

import (
	"strings"

	"k-view/pkg/k8sutils"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapResourceSpecifics(item unstructured.Unstructured, kind string, resItem *ResourceItem) {
	h.mapResourceSpecificsWithMetrics(item, kind, resItem, nil)
}

func (h *ResourceHandler) mapResourceSpecificsWithMetrics(item unstructured.Unstructured, kind string, resItem *ResourceItem, metricsMap map[string]unstructured.Unstructured) {
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
	// Check if we are fetching custom objects (kind is crds/customresourcedefinitions, but the item is the actual custom resource)
	if (kind == "crds" || kind == "customresourcedefinitions") && item.GetKind() != "CustomResourceDefinition" {
		h.mapWorkloadWithMetrics(item, "custom-object", resItem.Extra, resItem, metricsMap)
		return
	}

	switch kind {
	case "pods", "pod", "deployments", "deployment", "statefulsets", "statefulset", "daemonsets", "daemonset", "jobs", "job", "cronjobs", "cronjob", "replicasets", "replicaset", "replicationcontrollers", "hpas", "horizontalpodautoscalers":
		h.mapWorkloadWithMetrics(item, kind, resItem.Extra, resItem, metricsMap)
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
		extra["namespaced"] = "false"
		if scope == "Namespaced" {
			extra["namespaced"] = "true"
		}
	}
	extra["fullname"] = item.GetName()

	// Accepted Names
	if names, ok, _ := unstructured.NestedMap(item.Object, "spec", "names"); ok {
		if plural, ok := names["plural"].(string); ok {
			extra["name"] = plural
			extra["plural"] = plural
		}
		if singular, ok := names["singular"].(string); ok {
			extra["singular"] = singular
		}
		if kind, ok := names["kind"].(string); ok {
			extra["crd-kind"] = kind
		}
		if listKind, ok := names["listKind"].(string); ok {
			extra["listKind"] = listKind
		}
		if shortNames, ok, _ := unstructured.NestedSlice(item.Object, "spec", "names", "shortNames"); ok {
			var sn []string
			for _, s := range shortNames {
				if sStr, ok := s.(string); ok {
					sn = append(sn, sStr)
				}
			}
			extra["shortNames"] = strings.Join(sn, ", ")
		}
		if categories, ok, _ := unstructured.NestedSlice(item.Object, "spec", "names", "categories"); ok {
			var cat []string
			for _, c := range categories {
				if cStr, ok := c.(string); ok {
					cat = append(cat, cStr)
				}
			}
			extra["categories"] = strings.Join(cat, ", ")
		}
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
