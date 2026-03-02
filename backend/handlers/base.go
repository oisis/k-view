package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"k-view/k8s"
	"k-view/pkg/utils"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

// Shared Types
type ResourceItem struct {
	Name      string                 `json:"name"`
	Namespace string                 `json:"namespace,omitempty"`
	Age       string                 `json:"age"`
	Status    string                 `json:"status,omitempty"`
	Extra     map[string]string      `json:"extra,omitempty"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

type MetricHistory struct {
	Timestamp string  `json:"timestamp"`
	Value     float64 `json:"value"`
}

type ResourceHandler struct {
	devMode       bool
	k8sClient     k8s.KubernetesProvider
	mu            sync.Mutex
	mockResources map[string][]unstructured.Unstructured
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{
		devMode:       devMode,
		k8sClient:     k8sClient,
		mockResources: make(map[string][]unstructured.Unstructured),
	}
}

// Global Helpers
func isClusterScoped(kind string) bool {
	kind = strings.ToLower(kind)
	clusterScoped := []string{"nodes", "node", "namespaces", "namespace", "persistentvolumes", "pvs", "storage-classes", "storageclass", "cluster-roles", "clusterrole", "cluster-role-bindings", "clusterrolebinding", "crds", "customresourcedefinitions", "ingress-classes", "ingressclass"}
	for _, s := range clusterScoped {
		if s == kind { return true }
	}
	return false
}

func isDevMode() bool {
	return os.Getenv("DEV_MODE") == "true"
}

func getGVR(kind string) schema.GroupVersionResource {
	kind = strings.ToLower(kind)
	switch kind {
	case "pods", "pod": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "pods"}
	case "deployments", "deployment": return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
	case "statefulsets", "statefulset": return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
	case "daemonsets", "daemonset": return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
	case "replicasets", "replicaset": return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}
	case "services", "service": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}
	case "ingresses", "ingress": return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
	case "ingress-classes", "ingressclass": return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
	case "configmaps", "configmap": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "configmaps"}
	case "secrets", "secret": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "secrets"}
	case "pvcs", "persistentvolumeclaims": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
	case "pvs", "persistentvolumes": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
	case "storage-classes", "storageclass": return schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
	case "namespaces", "namespace": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "namespaces"}
	case "nodes", "node": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "nodes"}
	case "jobs", "job": return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
	case "cronjobs", "cronjob": return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
	case "hpas", "horizontalpodautoscalers": return schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
	case "roles": return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
	case "cluster-roles", "clusterrole": return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	case "role-bindings", "rolebinding": return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	case "cluster-role-bindings", "clusterrolebinding": return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	case "network-policies", "networkpolicy": return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
	case "service-accounts", "serviceaccount": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
	case "endpoints": return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	case "crds", "customresourcedefinitions": return schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
	default: return schema.GroupVersionResource{Group: "", Version: "v1", Resource: kind}
	}
}

func (h *ResourceHandler) getMockResources(kind, ns string) ([]unstructured.Unstructured, error) {
	mockKind := kind
	if !strings.HasSuffix(kind, "s") && kind != "ingress" && kind != "storageclass" && kind != "networkpolicy" {
		mockKind = kind + "s"
	}
	if kind == "ingress" { mockKind = "ingresses" }
	if kind == "storageclass" { mockKind = "storage-classes" }
	if kind == "networkpolicy" { mockKind = "network-policies" }

	locations := []string{
		filepath.Join("mocks", "resources", mockKind+".json"),
		filepath.Join("..", "mocks", "resources", mockKind+".json"),
		filepath.Join("..", "..", "mocks", "resources", mockKind+".json"),
	}

	var data []byte
	var err error
	for _, path := range locations {
		data, err = os.ReadFile(path)
		if err == nil { break }
	}

	if err != nil { return nil, err }

	var list struct {
		Items []map[string]interface{} `json:"items"`
	}
	if err := json.Unmarshal(data, &list); err != nil { return nil, err }

	var result []unstructured.Unstructured
	for _, item := range list.Items {
		u := unstructured.Unstructured{Object: item}
		if ns != "" && u.GetNamespace() != "" && u.GetNamespace() != ns {
			continue
		}
		result = append(result, u)
	}
	return result, nil
}

func (h *ResourceHandler) getMockResource(kind, ns, name string) (*unstructured.Unstructured, error) {
	items, err := h.getMockResources(kind, ns)
	if err != nil { return nil, err }
	for _, it := range items {
		if it.GetName() == name { return &it, nil }
	}
	return nil, fmt.Errorf("mock not found")
}

func (h *ResourceHandler) mockRawResourceList(kind, ns string) []unstructured.Unstructured {
	res, _ := h.getMockResources(kind, ns)
	return res
}

func (h *ResourceHandler) mockResourceList(kind, ns string) []ResourceItem {
	items, _ := h.getMockResources(kind, ns)
	var result []ResourceItem
	for _, it := range items {
		res := ResourceItem{
			Name:      it.GetName(),
			Namespace: it.GetNamespace(),
			Age:       utils.GetAge(it.GetCreationTimestamp().Time),
			Status:    "Active",
			Extra:     make(map[string]string),
		}
		h.mapResourceSpecifics(it, kind, &res)
		result = append(result, res)
	}
	return result
}
