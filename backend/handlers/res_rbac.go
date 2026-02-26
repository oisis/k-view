package handlers

import (
	"fmt"

	"k-view/pkg/k8sutils"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapRBAC(item unstructured.Unstructured, kind string, extra map[string]string, resItem *ResourceItem) {
	switch kind {
	case "service-accounts", "serviceaccounts":
		if secrets, ok, _ := unstructured.NestedSlice(item.Object, "secrets"); ok {
			extra["secrets"] = fmt.Sprintf("%d", len(secrets))
		} else {
			extra["secrets"] = "0"
		}

	case "roles", "cluster-roles":
		if rules, ok, _ := unstructured.NestedSlice(item.Object, "rules"); ok {
			extra["rules"] = fmt.Sprintf("%d rules", len(rules))
		} else {
			extra["rules"] = "0 rules"
		}

	case "role-bindings", "cluster-role-bindings":
		if roleRef, ok, _ := unstructured.NestedString(item.Object, "roleRef", "name"); ok {
			rkind, _, _ := unstructured.NestedString(item.Object, "roleRef", "kind")
			extra["role"] = fmt.Sprintf("%s/%s", rkind, roleRef)
		}
		if subjects, ok, _ := unstructured.NestedSlice(item.Object, "subjects"); ok {
			extra["subjects"] = fmt.Sprintf("%d subjects", len(subjects))
		} else {
			extra["subjects"] = "0 subjects"
		}
	}
	extra["labels"] = k8sutils.GetLabels(item.Object)
}
