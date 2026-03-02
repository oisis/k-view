package handlers

import (
	"k-view/k8s"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"strings"
)

type ResourceHandler struct {
	k8sClient k8s.KubernetesProvider
	devMode   bool
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{
		k8sClient: k8sClient,
		devMode:   devMode,
	}
}

// ResourceItem is a simplified representation of a K8s resource for the list view
type ResourceItem struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace,omitempty"`
	Status    string            `json:"status,omitempty"`
	Age       string            `json:"age,omitempty"`
	Labels    map[string]string `json:"labels,omitempty"`
	Extra     map[string]interface{} `json:"extra,omitempty"`
}

type ListResponse struct {
	Items []ResourceItem `json:"items"`
	Kind  string         `json:"kind"`
}

type MetricHistory struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

func getGVR(kind string) schema.GroupVersionResource {
	kind = strings.ToLower(kind)
	switch kind {
	case "pods", "pod":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	case "services", "service":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}
	case "configmaps", "configmap":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}
	case "secrets", "secret":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}
	case "namespaces", "namespace":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}
	case "nodes", "node":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "nodes"}
	case "events", "event":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "events"}
	case "persistentvolumeclaims", "pvcs", "pvc":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
	case "persistentvolumes", "pvs", "pv":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
	case "endpoints", "endpoint":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	case "serviceaccounts", "service-accounts", "sa":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
	case "deployments", "deployment", "deploy":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	case "statefulsets", "statefulset", "sts":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
	case "daemonsets", "daemonset", "ds":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
	case "replicasets", "replicaset", "rs":
		return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}
	case "jobs", "job":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
	case "cronjobs", "cronjob":
		return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	case "ingresses", "ingress", "ing":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
	case "networkpolicies", "network-policies", "netpol":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
	case "ingressclasses", "ingress-classes":
		return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
	case "horizontalpodautoscalers", "hpas", "hpa":
		return schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
	case "storageclasses", "storage-classes", "sc":
		return schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
	case "roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	case "rolebindings", "role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	case "clusterroles", "cluster-roles":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	case "clusterrolebindings", "cluster-role-bindings":
		return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	case "customresourcedefinitions", "crds", "crd":
		return schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	case "replicationcontrollers", "rc":
		return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "replicationcontrollers"}
	}
	return schema.GroupVersionResource{}
}

func isClusterScoped(kind string) bool {
	kind = strings.ToLower(kind)
	clusterResources := []string{
		"nodes", "node", "namespaces", "namespace",
		"persistentvolumes", "pvs", "pv",
		"clusterroles", "cluster-roles",
		"clusterrolebindings", "cluster-role-bindings",
		"storageclasses", "storage-classes", "sc",
		"customresourcedefinitions", "crds", "crd",
		"ingressclasses", "ingress-classes",
	}
	for _, r := range clusterResources {
		if r == kind {
			return true
		}
	}
	return false
}
