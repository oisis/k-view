package handlers

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"k-view/k8s"
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
	mockResources map[string][]ResourceItem
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	return &ResourceHandler{
		devMode:       devMode,
		k8sClient:     k8sClient,
		mockResources: make(map[string][]ResourceItem),
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

func (h *ResourceHandler) mockResourceList(kind, ns string) []ResourceItem {
	mockPath := filepath.Join("mocks", "resources", kind+".json")
	if _, err := os.Stat(mockPath); os.IsNotExist(err) {
		// Try parent directory if called from a subpackage (like during tests)
		mockPath = filepath.Join("..", "mocks", "resources", kind+".json")
	}
	
	if _, err := os.Stat(mockPath); err == nil {
		data, err := os.ReadFile(mockPath)
		if err == nil {
			var items []ResourceItem
			if err := json.Unmarshal(data, &items); err == nil {
				return filter(items, ns)
			}
		}
	}
	return h.internalMockResourceList(kind, ns)
}
