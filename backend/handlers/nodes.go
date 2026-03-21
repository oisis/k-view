package handlers

import (
	"net/http"
	"time"

	"k-view/k8s"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"github.com/gin-gonic/gin"
)

type NodeHandler struct {
	k8sClient k8s.KubernetesProvider
}

func NewNodeHandler(client k8s.KubernetesProvider) *NodeHandler {
	return &NodeHandler{k8sClient: client}
}

type NodeResponse struct {
	Name             string            `json:"name"`
	Role             string            `json:"role"`
	Status           string            `json:"status"`
	Age              string            `json:"age"`
	KubeletVersion   string            `json:"kubeletVersion"`
	ContainerRuntime string            `json:"containerRuntime"`
	OS               string            `json:"os"`
	Architecture     string            `json:"architecture"`
	CPUCapacity      string            `json:"cpuCapacity"`
	MemoryCapacity   string            `json:"memoryCapacity"`
	CPUAllocatable   string            `json:"cpuAllocatable"`
	MemoryAllocatable string           `json:"memoryAllocatable"`
	Labels           map[string]string `json:"labels"`
	CPURequests      string            `json:"cpuRequests"`
	CPULimits        string            `json:"cpuLimits"`
	RAMRequests      string            `json:"ramRequests"`
	RAMLimits        string            `json:"ramLimits"`
	PodsCount        int               `json:"podsCount"`
}

func nodeRole(node corev1.Node) string {
	if _, ok := node.Labels["node-role.kubernetes.io/control-plane"]; ok {
		return "control-plane"
	}
	if _, ok := node.Labels["node-role.kubernetes.io/master"]; ok {
		return "control-plane"
	}
	return "worker"
}

func nodeStatus(node corev1.Node) string {
	for _, c := range node.Status.Conditions {
		if c.Type == corev1.NodeReady {
			if c.Status == corev1.ConditionTrue {
				return "Ready"
			}
			return "NotReady"
		}
	}
	return "Unknown"
}

func (h *NodeHandler) GetNodeDetails(c *gin.Context) {
	nodeName := c.Param("name")
	ctx := c.Request.Context()

	node, err := h.k8sClient.GetNode(ctx, nodeName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Node not found"})
		return
	}

	pods, err := h.k8sClient.ListAllPods(ctx)
	var nodePods []ResourceItem
	podMgr := NewPodManager()
	if err == nil {
		for _, p := range pods {
			if p.Spec.NodeName == nodeName {
				// Convert to unstructured for mapper
				u := unstructured.Unstructured{}
				u.Object = make(map[string]interface{})
				
				// Map necessary fields for the DTO
				u.SetName(p.Name)
				u.SetNamespace(p.Namespace)
				u.SetCreationTimestamp(p.CreationTimestamp)
				
				nodePods = append(nodePods, podMgr.MapItem(u, nil))
			}
		}
	}

	// For node details, we will return the full Node object plus aggregated data
	c.JSON(http.StatusOK, gin.H{
		"resource": node,
		"metadata": node.ObjectMeta,
		"spec":     node.Spec,
		"status":   node.Status,
		"relatedPods": nodePods,
	})
}

func (h *NodeHandler) ListNodes(c *gin.Context) {
	ctx := c.Request.Context()
	nodes, err := h.k8sClient.ListNodes(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list nodes: " + err.Error()})
		return
	}

	pods, err := h.k8sClient.ListPods(ctx, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods for node stats: " + err.Error()})
		return
	}

	// Map to store stats per node
	type nodeStats struct {
		cpuReq   resource.Quantity
		cpuLim   resource.Quantity
		ramReq   resource.Quantity
		ramLim   resource.Quantity
		podCount int
	}
	statsMap := make(map[string]*nodeStats)

	for _, p := range pods {
		if p.Spec.NodeName == "" {
			continue
		}
		if _, ok := statsMap[p.Spec.NodeName]; !ok {
			statsMap[p.Spec.NodeName] = &nodeStats{}
		}
		s := statsMap[p.Spec.NodeName]
		s.podCount++

		for _, container := range p.Spec.Containers {
			s.cpuReq.Add(*container.Resources.Requests.Cpu())
			s.cpuLim.Add(*container.Resources.Limits.Cpu())
			s.ramReq.Add(*container.Resources.Requests.Memory())
			s.ramLim.Add(*container.Resources.Limits.Memory())
		}
	}

	// Initialize as empty slice to avoid 'null' in JSON
	response := []NodeResponse{}
	for _, n := range nodes {
		cpu := n.Status.Capacity.Cpu()
		mem := n.Status.Capacity.Memory()
		cpuAlloc := n.Status.Allocatable.Cpu()
		memAlloc := n.Status.Allocatable.Memory()

		stats := statsMap[n.Name]
		if stats == nil {
			stats = &nodeStats{}
		}

		response = append(response, NodeResponse{
			Name:              n.Name,
			Role:              nodeRole(n),
			Status:            nodeStatus(n),
			Age:               n.CreationTimestamp.Format(time.RFC3339),
			KubeletVersion:    n.Status.NodeInfo.KubeletVersion,
			ContainerRuntime:  n.Status.NodeInfo.ContainerRuntimeVersion,
			OS:                n.Status.NodeInfo.OSImage,
			Architecture:      n.Status.NodeInfo.Architecture,
			CPUCapacity:       cpu.String(),
			MemoryCapacity:    mem.String(),
			CPUAllocatable:    cpuAlloc.String(),
			MemoryAllocatable: memAlloc.String(),
			Labels:            n.Labels,
			CPURequests:       stats.cpuReq.String(),
			CPULimits:         stats.cpuLim.String(),
			RAMRequests:       stats.ramReq.String(),
			RAMLimits:         stats.ramLim.String(),
			PodsCount:         stats.podCount,
		})
	}

	c.JSON(http.StatusOK, response)
}
