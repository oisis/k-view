package handlers

import (
	"context"
	"fmt"
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

	allAssignments := h.config.Assignments
	if !h.devMode {
		live := h.fetchLiveAssignments(c.Request.Context())
		allAssignments = deduplicateAssignments(append(allAssignments, live...))
	}

	c.JSON(http.StatusOK, StatusResponse{
		Email:       email.(string),
		Role:        role.(string),
		Namespace:   namespace,
		Rules:       rules,
		Assignments: allAssignments,
	})
}

func (h *RBACHandler) fetchLiveAssignments(ctx context.Context) []rbac.Assignment {
	dyn, err := h.k8sProvider.GetDynamicClient(ctx)
	if err != nil {
		return nil
	}

	var results []rbac.Assignment

	// Fetch ClusterRoleBindings
	crbGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "clusterrolebindings"}
	crbList, err := dyn.Resource(crbGVR).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, item := range crbList.Items {
			if strings.HasPrefix(item.GetName(), "kview-") {
				results = append(results, extractAssignments(item.Object, "")...)
			}
		}
	}

	// Fetch RoleBindings (All namespaces)
	rbGVR := schema.GroupVersionResource{Group: "rbac.authorization.k8s.io", Version: "v1", Resource: "rolebindings"}
	rbList, err := dyn.Resource(rbGVR).List(ctx, metav1.ListOptions{})
	if err == nil {
		for _, item := range rbList.Items {
			if strings.HasPrefix(item.GetName(), "kview-") {
				results = append(results, extractAssignments(item.Object, item.GetNamespace())...)
			}
		}
	}

	return results
}

func extractAssignments(obj map[string]interface{}, ns string) []rbac.Assignment {
	var list []rbac.Assignment
	roleRef, _, _ := unstructured.NestedMap(obj, "roleRef")
	roleName := ""
	if roleRef != nil {
		roleName, _ = roleRef["name"].(string)
	}

	subjects, _, _ := unstructured.NestedSlice(obj, "subjects")
	for _, s := range subjects {
		subjectMap, ok := s.(map[string]interface{})
		if !ok {
			continue
		}
		kind, _ := subjectMap["kind"].(string)
		name, _ := subjectMap["name"].(string)

		a := rbac.Assignment{Role: roleName, Namespace: ns}
		if kind == "User" || kind == "ServiceAccount" {
			a.User = name
		} else if kind == "Group" {
			a.Group = name
		}
		list = append(list, a)
	}
	return list
}

func deduplicateAssignments(assignments []rbac.Assignment) []rbac.Assignment {
	seen := make(map[string]bool)
	var result []rbac.Assignment

	for _, a := range assignments {
		// Create a unique key for the assignment
		key := fmt.Sprintf("%s|%s|%s|%s", a.User, a.Group, a.Role, a.Namespace)
		if !seen[key] {
			seen[key] = true
			result = append(result, a)
		}
	}

	return result
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
