package handlers

import (
	"net/http"
	"strings"

	"k-view/rbac"

	"github.com/gin-gonic/gin"
)

type RBACHandler struct {
	config *rbac.RBACConfig
}

func NewRBACHandler(config *rbac.RBACConfig) *RBACHandler {
	return &RBACHandler{config: config}
}

type Rule struct {
	Resource string `json:"resource"`
	Verbs    string `json:"verbs"`
}

type StatusResponse struct {
	Email       string            `json:"email"`
	Role        string            `json:"role"`
	Namespace   string            `json:"namespace"`
	Rules       []Rule            `json:"rules"`
	Assignments []rbac.Assignment `json:"assignments"`
}

// GetStatus returns the RBAC assignments and the current user's computed permissions.
func (h *RBACHandler) GetStatus(c *gin.Context) {
	email, _ := c.Get("email")
	role, _ := c.Get("role")
	ns, exists := c.Get("namespace")
	
	namespace := ""
	if exists && ns != nil {
		namespace = ns.(string)
	}

	// Compute effective rules for frontend display based on standard names
	var rules []Rule
	switch strings.ToLower(role.(string)) {
	case "kview-cluster-admin", "admin":
		rules = []Rule{{Resource: "All Resources", Verbs: "All Access (*)"}}
	case "kview-cluster-developer":
		rules = []Rule{
			{Resource: "Pods, Deployments, Services", Verbs: "Get, List, Create, Update, Delete"},
			{Resource: "Namespaces, Nodes", Verbs: "Get, List (Read-Only)"},
		}
	case "kview-cluster-viewer", "viewer":
		rules = []Rule{{Resource: "Most Resources (excluding Secrets)", Verbs: "Get, List (Read-Only)"}}
	case "kview-namespace-admin":
		rules = []Rule{{Resource: "All Resources in " + namespace, Verbs: "All Access (*)"}}
	case "kview-namespace-developer":
		rules = []Rule{{Resource: "Pods, Deployments, Services in " + namespace, Verbs: "Get, List, Create, Update, Delete"}}
	case "kview-namespace-viewer":
		rules = []Rule{{Resource: "Most Resources in " + namespace, Verbs: "Get, List (Read-Only)"}}
	default:
		rules = []Rule{{Resource: "Unknown", Verbs: "No Access"}}
	}

	c.JSON(http.StatusOK, StatusResponse{
		Email:       email.(string),
		Role:        role.(string),
		Namespace:   namespace,
		Rules:       rules,
		Assignments: h.config.Assignments,
	})
}
