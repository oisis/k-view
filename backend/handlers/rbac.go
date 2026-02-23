package handlers

import (
	"net/http"
	"strings"

	"k-view/rbac"

	"k-view/k8s"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"github.com/gin-gonic/gin"
)

type RBACHandler struct {
	devMode     bool
	config      *rbac.RBACConfig
	k8sProvider k8s.KubernetesProvider
}

func NewRBACHandler(devMode bool, config *rbac.RBACConfig, k8sProvider k8s.KubernetesProvider) *RBACHandler {
	return &RBACHandler{
		devMode:     devMode,
		config:      config,
		k8sProvider: k8sProvider,
	}
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

// ListRoles returns all ClusterRoles labeled as part of k-view.
func (h *RBACHandler) ListRoles(c *gin.Context) {
	if h.devMode {
		// Mock roles for development
		mockRoles := []gin.H{
			{
				"name": "kview-cluster-admin",
				"rules": []gin.H{
					{"apiGroups": []string{"*"}, "resources": []string{"*"}, "verbs": []string{"*"}},
				},
			},
			{
				"name": "kview-cluster-viewer",
				"rules": []gin.H{
					{"apiGroups": []string{""}, "resources": []string{"pods", "services"}, "verbs": []string{"get", "list", "watch"}},
				},
			},
		}
		c.JSON(http.StatusOK, mockRoles)
		return
	}

	dyn, err := h.k8sProvider.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get kubernetes client: " + err.Error()})
		return
	}

	gvr := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterroles"}
	list, err := dyn.Resource(gvr).List(c.Request.Context(), metav1.ListOptions{
		LabelSelector: "app.kubernetes.io/name=k-view",
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list ClusterRoles: " + err.Error()})
		return
	}

	var roles []gin.H
	for _, item := range list.Items {
		name := item.GetName()
		rules, _, _ := unstructured.NestedSlice(item.Object, "rules")
		roles = append(roles, gin.H{
			"name":  name,
			"rules": rules,
		})
	}

	c.JSON(http.StatusOK, roles)
}

// GetMyDetails returns the current user's computed permissions.
func (h *RBACHandler) GetMyDetails(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	role, exists := c.Get("role")
	if !exists {
		role = "viewer"
	}
	ns, _ := c.Get("namespace")
	
	namespace := ""
	if ns != nil {
		namespace = ns.(string)
	}

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

	c.JSON(http.StatusOK, gin.H{
		"email":     email.(string),
		"role":      role.(string),
		"namespace": namespace,
		"rules":     rules,
	})
}
