package handlers

import (
	"k-view/k8s"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"strings"
)

type ResourceHandler struct {
	k8sClient k8s.KubernetesProvider
	devMode   bool
	registry  *ResourceRegistry
}

func NewResourceHandler(devMode bool, k8sClient k8s.KubernetesProvider) *ResourceHandler {
	// Initialize the registry with the fallback GenericManager
	fallbackMgr := NewGenericManager(schema.GroupVersionResource{}, false)
	registry := NewResourceRegistry(fallbackMgr)

	// Register specific resource managers
	registry.Register("pods", NewPodManager())
	registry.Register("pod", NewPodManager())
	registry.Register("services", NewServiceManager())
	registry.Register("service", NewServiceManager())
	registry.Register("deployments", NewDeploymentManager())
	registry.Register("deployment", NewDeploymentManager())
	registry.Register("deploy", NewDeploymentManager())
	registry.Register("statefulsets", NewStatefulSetManager())
	registry.Register("statefulset", NewStatefulSetManager())
	registry.Register("sts", NewStatefulSetManager())
	registry.Register("daemonsets", NewDaemonSetManager())
	registry.Register("daemonset", NewDaemonSetManager())
	registry.Register("ds", NewDaemonSetManager())
	registry.Register("replicasets", NewReplicaSetManager())
	registry.Register("replicaset", NewReplicaSetManager())
	registry.Register("rs", NewReplicaSetManager())
	registry.Register("jobs", NewJobManager())
	registry.Register("job", NewJobManager())
	registry.Register("cronjobs", NewCronJobManager())
	registry.Register("cronjob", NewCronJobManager())
	registry.Register("cj", NewCronJobManager())
	registry.Register("persistentvolumeclaims", NewPVCManager())
	registry.Register("persistentvolumeclaim", NewPVCManager())
	registry.Register("pvc", NewPVCManager())
	registry.Register("persistentvolumes", NewPVManager())
	registry.Register("persistentvolume", NewPVManager())
	registry.Register("pv", NewPVManager())
	registry.Register("storageclasses", NewStorageClassManager())
	registry.Register("storageclass", NewStorageClassManager())
	registry.Register("sc", NewStorageClassManager())

	return &ResourceHandler{
		k8sClient: k8sClient,
		devMode:   devMode,
		registry:  registry,
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
        case "persistentvolumeclaims", "persistentvolumeclaim":
                return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumeclaims"}
        case "persistentvolumes", "persistentvolume":
                return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "persistentvolumes"}
        case "endpoints", "endpoint":
                return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
        case "serviceaccounts", "serviceaccount":
                return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "serviceaccounts"}
        case "deployments", "deployment":
                return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
        case "statefulsets", "statefulset":
                return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
        case "daemonsets", "daemonset":
                return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
        case "replicasets", "replicaset":
                return schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "replicasets"}
        case "jobs", "job":
                return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
        case "cronjobs", "cronjob":
                return schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "cronjobs"}
        case "ingresses", "ingress":
                return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}
        case "networkpolicies", "networkpolicy":
                return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}
        case "ingressclasses", "ingressclass":
                return schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingressclasses"}
        case "horizontalpodautoscalers", "horizontalpodautoscaler":
                return schema.GroupVersionResource{Group: "autoscaling", Version: "v2", Resource: "horizontalpodautoscalers"}
        case "storageclasses", "storageclass":
                return schema.GroupVersionResource{Group: "storage.k8s.io", Version: "v1", Resource: "storageclasses"}
        case "roles":
                return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "roles"}
        case "rolebindings", "rolebinding":
                return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
        case "clusterroles", "clusterrole":
                return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
        case "clusterrolebindings", "clusterrolebinding":
                return schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
        case "customresourcedefinitions", "customresourcedefinition":
                return schema.GroupVersionResource{Group: "apiextensions.k8s.io", Version: "v1", Resource: "customresourcedefinitions"}
        case "replicationcontrollers", "replicationcontroller":
                return schema.GroupVersionResource{Group: "", Version: "v1", Resource: "replicationcontrollers"}
        }
        return schema.GroupVersionResource{}
}

func isClusterScoped(kind string) bool {
        kind = strings.ToLower(kind)
        clusterResources := []string{
                "nodes", "node", "namespaces", "namespace",
                "persistentvolumes", "persistentvolume",
                "clusterroles", "clusterrole",
                "clusterrolebindings", "clusterrolebinding",
                "storageclasses", "storageclass",
                "customresourcedefinitions", "customresourcedefinition",
                "ingressclasses", "ingressclass",
        }
        for _, r := range clusterResources {
                if r == kind {
                        return true
                }
        }
        return false
}
