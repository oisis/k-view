package handlers

import (
	"context"
	"net/http"

	"k-view/k8s"

	"github.com/gin-gonic/gin"
)

type PodHandler struct {
	k8sClient *k8s.Client
}

func NewPodHandler(client *k8s.Client) *PodHandler {
	return &PodHandler{k8sClient: client}
}

func (h *PodHandler) ListPods(c *gin.Context) {
	// In a real app we might read namespace from a query param, but let's default to all namespaces (empty string)
	namespace := c.Query("namespace")

	pods, err := h.k8sClient.ListPods(context.Background(), namespace)
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
		response = append(response, PodResponse{
			Name:      p.Name,
			Namespace: p.Namespace,
			Status:    string(p.Status.Phase),
			Age:       p.CreationTimestamp.Time.String(),
		})
	}

	c.JSON(http.StatusOK, response)
}
