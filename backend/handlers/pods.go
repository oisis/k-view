package handlers

import (
	"log"
	"net/http"
	"strconv"

	"k-view/k8s"

	"github.com/gin-gonic/gin"
)

type PodHandler struct {
	k8sClient k8s.KubernetesProvider
}

func NewPodHandler(client k8s.KubernetesProvider) *PodHandler {
	return &PodHandler{k8sClient: client}
}

func (h *PodHandler) ListPods(c *gin.Context) {
	namespace := c.Query("namespace")
	if namespace == "-" {
		namespace = ""
	}

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		namespace = rbacNs.(string)
	}

	pods, err := h.k8sClient.ListPods(c.Request.Context(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods: " + err.Error()})
		return
	}

	type PodResponse struct {
		Name      string `json:"name"`
		Namespace string `json:"namespace"`
		Status    string `json:"status"`
		Age       string `json:"age"`
	}

	var response []PodResponse
	for _, p := range pods {
		// If a container is in CrashLoopBackOff, surface that as the status
		status := string(p.Status.Phase)
		for _, cs := range p.Status.ContainerStatuses {
			if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
				status = cs.State.Waiting.Reason
				break
			}
		}
		response = append(response, PodResponse{
			Name:      p.Name,
			Namespace: p.Namespace,
			Status:    status,
			Age:       p.CreationTimestamp.Time.String(),
		})
	}

	c.JSON(http.StatusOK, response)
}

func (h *PodHandler) ListNamespaces(c *gin.Context) {
	namespaces, err := h.k8sClient.ListNamespaces(c.Request.Context())
	if err != nil {
		log.Printf("ERROR: Failed to list namespaces: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list namespaces: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, namespaces)
}
func (h *PodHandler) GetLogs(c *gin.Context) {
	namespace := c.Param("namespace")
	if namespace == "-" {
		namespace = ""
	}
	pod := c.Param("name")
	container := c.Query("container")
	tailStr := c.DefaultQuery("tail", "1000")

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if namespace != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + namespace})
			return
		}
	}
	tail, _ := strconv.ParseInt(tailStr, 10, 64)

	logs, err := h.k8sClient.GetPodLogs(c.Request.Context(), namespace, pod, container, tail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get logs: " + err.Error()})
		return
	}

	c.String(http.StatusOK, logs)
}
