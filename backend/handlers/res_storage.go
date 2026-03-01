package handlers

import (
	"fmt"
	"strings"

	"k-view/pkg/k8sutils"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapStorage(item unstructured.Unstructured, kind string, extra map[string]string, resItem *ResourceItem) {
	switch kind {
	case "persistentvolumeclaims", "pvcs":
		if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
			resItem.Status = phase
		}
		if cap, ok, _ := unstructured.NestedString(item.Object, "status", "capacity", "storage"); ok {
			extra["capacity"] = cap
		}
		if sc, ok, _ := unstructured.NestedString(item.Object, "spec", "storageClassName"); ok {
			extra["storage-class"] = sc
		}
		if vol, ok, _ := unstructured.NestedString(item.Object, "spec", "volumeName"); ok {
			extra["volume"] = vol
		}
		if accModes, ok, _ := unstructured.NestedSlice(item.Object, "spec", "accessModes"); ok {
			var ms []string
			for _, m := range accModes {
				if msStr, ok := m.(string); ok {
					ms = append(ms, msStr)
				}
			}
			extra["access-modes"] = strings.Join(ms, ", ")
		}
		extra["labels"] = k8sutils.GetLabels(item.Object)

	case "persistentvolumes", "pvs":
		if phase, ok, _ := unstructured.NestedString(item.Object, "status", "phase"); ok {
			resItem.Status = phase
		}
		if cap, ok, _ := unstructured.NestedString(item.Object, "spec", "capacity", "storage"); ok {
			extra["capacity"] = cap
		}
		if reclaim, ok, _ := unstructured.NestedString(item.Object, "spec", "persistentVolumeReclaimPolicy"); ok {
			extra["reclaim-policy"] = reclaim
		}
		if sc, ok, _ := unstructured.NestedString(item.Object, "spec", "storageClassName"); ok {
			extra["storage-class"] = sc
		}
		if claimRef, ok, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "name"); ok {
			claimNs, _, _ := unstructured.NestedString(item.Object, "spec", "claimRef", "namespace")
			extra["claim"] = fmt.Sprintf("%s/%s", claimNs, claimRef)
		}

	case "storage-classes":
		if provisioner, ok, _ := unstructured.NestedString(item.Object, "provisioner"); ok {
			extra["provisioner"] = provisioner
		}
		if reclaim, ok, _ := unstructured.NestedString(item.Object, "reclaimPolicy"); ok {
			extra["reclaim-policy"] = reclaim
		}
		if bindingMode, ok, _ := unstructured.NestedString(item.Object, "volumeBindingMode"); ok {
			extra["volume-binding-mode"] = bindingMode
		}
		if params, ok, _ := unstructured.NestedMap(item.Object, "parameters"); ok {
			var ps []string
			for k, v := range params {
				ps = append(ps, fmt.Sprintf("%s=%s", k, v))
			}
			extra["parameters"] = strings.Join(ps, ", ")
		}
		if isDef, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "storageclass.kubernetes.io/is-default-class"); ok && isDef == "true" {
			resItem.Status = "Default"
		}

	case "secrets":
		if sType, ok, _ := unstructured.NestedString(item.Object, "type"); ok {
			extra["type"] = sType
		}
		extra["labels"] = k8sutils.GetLabels(item.Object)
	}
}
