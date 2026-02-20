package handlers

import (
	"context"
	"net/http"

	"k-view/k8s"

	corev1 "k8s.io/api/core/v1"
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

func (h *NodeHandler) ListNodes(c *gin.Context) {
	nodes, err := h.k8sClient.ListNodes(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list nodes: " + err.Error()})
		return
	}

	var response []NodeResponse
	for _, n := range nodes {
		cpu := n.Status.Capacity.Cpu()
		mem := n.Status.Capacity.Memory()
		cpuAlloc := n.Status.Allocatable.Cpu()
		memAlloc := n.Status.Allocatable.Memory()

		response = append(response, NodeResponse{
			Name:              n.Name,
			Role:              nodeRole(n),
			Status:            nodeStatus(n),
			Age:               n.CreationTimestamp.Time.String(),
			KubeletVersion:    n.Status.NodeInfo.KubeletVersion,
			ContainerRuntime:  n.Status.NodeInfo.ContainerRuntimeVersion,
			OS:                n.Status.NodeInfo.OSImage,
			Architecture:      n.Status.NodeInfo.Architecture,
			CPUCapacity:       cpu.String(),
			MemoryCapacity:    mem.String(),
			CPUAllocatable:    cpuAlloc.String(),
			MemoryAllocatable: memAlloc.String(),
		})
	}

	c.JSON(http.StatusOK, response)
}
