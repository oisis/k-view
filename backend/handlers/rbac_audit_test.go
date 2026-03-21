package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"k-view/k8s"
	"k-view/pkg/contextutils"
	corev1 "k8s.io/api/core/v1"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockKubernetesProvider is a mock for testing RBAC
type MockKubernetesProvider struct {
	mock.Mock
	k8s.KubernetesProvider
}

func (m *MockKubernetesProvider) ListNodes(ctx context.Context) ([]corev1.Node, error) {
	// Simulate K8s RBAC check based on impersonation headers in context
	val, _ := contextutils.GetUser(ctx)
	user, _ := val.(k8s.UserContext)
	
	// If it's an admin (no impersonation) or a user with node access
	if user.Role == "kview-cluster-admin" || user.Role == "admin" {
		return []corev1.Node{{}}, nil
	}
	
	// Simulate 403 Forbidden from K8s API for other users
	return nil, fmt.Errorf("nodes is forbidden: User \"%s\" cannot list resource \"nodes\"", user.Email)
}

func (m *MockKubernetesProvider) ListPods(ctx context.Context, ns string) ([]corev1.Pod, error) {
	return []corev1.Pod{}, nil
}

func TestRBACMatrix_Nodes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	mockK8s := new(MockKubernetesProvider)
	handler := NewNodeHandler(mockK8s)
	
	t.Run("Admin should see nodes", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		
		// Setup context with Admin user
		userCtx := k8s.UserContext{Email: "admin@kview.local", Role: "admin"}
		req, _ := http.NewRequest("GET", "/api/nodes", nil)
		c.Request = req.WithContext(contextutils.WithUser(req.Context(), userCtx))
		
		handler.ListNodes(c)
		
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Viewer should get 500/403 for nodes", func(t *testing.T) {
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)
		
		// Setup context with Viewer user
		userCtx := k8s.UserContext{Email: "user@kview.local", Role: "viewer"}
		req, _ := http.NewRequest("GET", "/api/nodes", nil)
		c.Request = req.WithContext(contextutils.WithUser(req.Context(), userCtx))
		
		handler.ListNodes(c)
		
		// Our handler returns 500 when K8s API returns an error
		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "forbidden")
	})
}
