package handlers

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"k-view/k8s"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

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

type ClusterStats struct {
	K8sVersion     string          `json:"k8sVersion"`
	NodeCount      int             `json:"nodeCount"`
	NodeCountReady int             `json:"nodeCountReady"`
	PodCount       int             `json:"podCount"`
	PodCountFailed int             `json:"podCountFailed"`
	CPUUsage       float64         `json:"cpuUsage"` // Percentage
	CPUTotal       string          `json:"cpuTotal"` // e.g., "32 Cores"
	RAMUsage       float64         `json:"ramUsage"` // Percentage
	RAMTotal       string          `json:"ramTotal"` // e.g., "128 GiB"
	ClusterName    string          `json:"clusterName"`
	ETCDHealth     string          `json:"etcdHealth"`
	MetricsServer  bool            `json:"metricsServer"`
	CPUHistory     []MetricHistory `json:"cpuHistory"`
	RAMHistory     []MetricHistory `json:"ramHistory"`
}

type ResourceHandler struct {
	devMode       bool
	k8sClient     k8s.KubernetesProvider
	mu            sync.Mutex
	cpuHistory    []MetricHistory
	ramHistory    []MetricHistory
	mockResources map[string][]unstructured.Unstructured
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{
		devMode:       devMode,
		k8sClient:     k8sClient,
		mockResources: make(map[string][]unstructured.Unstructured),
	}
}

var clusterScopedKinds = map[string]bool{
	"namespaces":            true,
	"nodes":                 true,
	"pvs":                   true,
	"storage-classes":       true,
	"crds":                  true,
	"cluster-roles":         true,
	"cluster-role-bindings": true,
	"ingress-classes":       true,
}

func isClusterScoped(kind string) bool {
	return clusterScopedKinds[strings.ToLower(kind)]
}

func filterUnstructured(items []unstructured.Unstructured, ns string) []unstructured.Unstructured {
	if ns == "" {
		return items
	}
	var res []unstructured.Unstructured
	for _, it := range items {
		if it.GetNamespace() == "" || it.GetNamespace() == ns {
			res = append(res, it)
		}
	}
	return res
}

func (h *ResourceHandler) mockResourceList(kind, ns string) []ResourceItem {
	// Possible locations for the mocks directory
	wd, _ := os.Getwd()
	locations := []string{
		filepath.Join(wd, "mocks", "resources", kind+".json"),
		filepath.Join(wd, "backend", "mocks", "resources", kind+".json"),
		filepath.Join(wd, "..", "mocks", "resources", kind+".json"),
		filepath.Join(wd, "..", "backend", "mocks", "resources", kind+".json"),
		filepath.Join("mocks", "resources", kind+".json"),
		filepath.Join("/app/mocks", "resources", kind+".json"),
	}

	for _, mockPath := range locations {
		if _, err := os.Stat(mockPath); err == nil {
			data, err := os.ReadFile(mockPath)
			if err == nil {
				var items []ResourceItem
				if err := json.Unmarshal(data, &items); err == nil {
					fmt.Printf("[Mock Legacy] Loaded %d items for %s from %s\n", len(items), kind, mockPath)
					return filter(items, ns)
				}
			}
		}
	}

	fmt.Printf("[Mock] No JSON mockup found for %s. (wd: %s). Falling back to internal.\n", kind, wd)
	return h.internalMockResourceList(kind, ns)
}

func filter(items []ResourceItem, ns string) []ResourceItem {
	if ns == "" {
		return items
	}
	var res []ResourceItem
	for _, it := range items {
		if it.Namespace == "" || it.Namespace == ns {
			res = append(res, it)
		}
	}
	return res
}

func (h *ResourceHandler) internalMockResourceList(kind, ns string) []ResourceItem {
	return []ResourceItem{
		{Name: "mock-" + kind + "-1", Namespace: "default", Age: "1h", Status: "Active"},
		{Name: "mock-" + kind + "-2", Namespace: "kube-system", Age: "2h", Status: "Active"},
	}
}

func (h *ResourceHandler) mockRawResourceList(kind, ns string) []unstructured.Unstructured {
	// Possible locations for the mocks directory
	wd, _ := os.Getwd()
	locations := []string{
		filepath.Join(wd, "mocks", "resources", kind+".json"),
		filepath.Join(wd, "backend", "mocks", "resources", kind+".json"),
		filepath.Join(wd, "..", "mocks", "resources", kind+".json"),
		filepath.Join(wd, "..", "backend", "mocks", "resources", kind+".json"),
		filepath.Join("mocks", "resources", kind+".json"),
		filepath.Join("/app/mocks", "resources", kind+".json"),
	}

	for _, mockPath := range locations {
		if _, err := os.Stat(mockPath); err == nil {
			data, err := os.ReadFile(mockPath)
			if err == nil {
				var list unstructured.UnstructuredList
				if err := json.Unmarshal(data, &list); err == nil {
					fmt.Printf("[Mock] Loaded %d items for %s from %s\n", len(list.Items), kind, mockPath)
					return filterUnstructured(list.Items, ns)
				}
				// If not a List format, try single array (fallback for old mocks)
				var items []unstructured.Unstructured
				if err := json.Unmarshal(data, &items); err == nil {
					fmt.Printf("[Mock] Loaded %d items (legacy array) for %s from %s\n", len(items), kind, mockPath)
					return filterUnstructured(items, ns)
				}
				fmt.Printf("[Mock] Error unmarshaling %s: %v\n", mockPath, err)
			}
		}
	}

	fmt.Printf("[Mock] No JSON mockup found for %s. (wd: %s). Falling back to internal.\n", kind, wd)
	return nil // Should be handled by internal fallback in resources.go
}
