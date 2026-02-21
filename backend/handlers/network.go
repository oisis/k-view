package handlers

import (
	"net/http"

	"k-view/k8s"

	"github.com/gin-gonic/gin"
)

type NetworkHandler struct {
	k8sClient k8s.KubernetesProvider
}

func NewNetworkHandler(client k8s.KubernetesProvider) *NetworkHandler {
	return &NetworkHandler{k8sClient: client}
}

func (h *NetworkHandler) Trace(c *gin.Context) {
	resType := c.Param("type")
	namespace := c.Param("namespace")
	name := c.Param("name")

	// Apply RBAC namespace restriction if needed (can be abstracted from resource handler)
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if namespace != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + namespace})
			return
		}
	}

	trace, err := k8s.TraceFlow(c.Request.Context(), h.k8sClient, resType, namespace, name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, trace)
}
