package handlers

import (
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strings"

	"github.com/gin-gonic/gin"

	"k-view/k8s"
)

var allowedKubectlCommands = map[string]bool{
	"get":          true,
	"describe":     true,
	"logs":         true,
	"top":          true,
	"explain":      true,
	"version":      true,
	"cluster-info": true,
}

var forbiddenKubectlFlags = []string{
	"--as",
	"--as-group",
	"--as-uid",
	"--token",
	"--server",
	"--certificate-authority",
	"--client-certificate",
	"--client-key",
	"--kubeconfig",
	"--username",
	"--password",
	"--proxy-url",
	"--tls-server-name",
	"--insecure-skip-tls-verify",
}

// ConsoleHandler handles kubectl command execution.
type ConsoleHandler struct {
	devMode bool
}

func NewConsoleHandler(devMode bool) *ConsoleHandler {
	return &ConsoleHandler{devMode: devMode}
}

// ExecRequest is the body of a POST /api/console/exec request.
type ExecRequest struct {
	Command string `json:"command" binding:"required"`
}

// Exec executes a kubectl command and returns its output.
// @Summary Kubectl Exec
// @Description Execute a restricted kubectl command and return its output
// @Tags Console
// @Accept json
// @Produce json
// @Param body body ExecRequest true "Kubectl command"
// @Success 200 {object} map[string]interface{}
// @Security BearerAuth
// @Router /api/console/exec [post]
func (h *ConsoleHandler) Exec(c *gin.Context) {
	var req ExecRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "command is required"})
		return
	}

	cmd := strings.TrimSpace(req.Command)

	// Expand the `k` alias to `kubectl`
	if strings.HasPrefix(cmd, "k ") {
		cmd = "kubectl " + cmd[2:]
	} else if cmd == "k" {
		cmd = "kubectl"
	}

	// Security: only allow kubectl commands
	if !strings.HasPrefix(cmd, "kubectl") {
		c.JSON(http.StatusForbidden, gin.H{
			"output":   fmt.Sprintf("bash: %s: command not found\nOnly kubectl commands are supported.", strings.Fields(cmd)[0]),
			"exitCode": 127,
		})
		return
	}

	parts := strings.Fields(cmd)
	if len(parts) > 1 {
		subCmd := parts[1]
		if !allowedKubectlCommands[subCmd] {
			c.JSON(http.StatusForbidden, gin.H{
				"output":   fmt.Sprintf("error: command '%s' is not allowed in this console.", subCmd),
				"exitCode": 1,
			})
			return
		}

		// Check for forbidden flags
		for _, arg := range parts[1:] {
			for _, forbidden := range forbiddenKubectlFlags {
				if strings.HasPrefix(arg, forbidden) {
					c.JSON(http.StatusForbidden, gin.H{
						"output":   fmt.Sprintf("error: flag '%s' is forbidden for security reasons.", forbidden),
						"exitCode": 1,
					})
					return
				}
			}
		}
	}

	// Extract user context from Gin
	userCtxValue, exists := c.Get("userCtx")
	var user k8s.UserContext
	if exists {
		if u, ok := userCtxValue.(k8s.UserContext); ok {
			user = u
		}
	}

	output, exitCode := realKubectl(parts, user)

	c.JSON(http.StatusOK, gin.H{
		"output":   output,
		"exitCode": exitCode,
	})
}

// realKubectl executes kubectl against the real cluster using the in-cluster service account,
// while impersonating the logged-in user if they are not an administrator.
func realKubectl(parts []string, user k8s.UserContext) (string, int) {
	if len(parts) == 0 {
		return "", 0
	}

	// Force in-cluster config if running inside Kubernetes to prevent localhost fallbacks
	host := os.Getenv("KUBERNETES_SERVICE_HOST")
	port := os.Getenv("KUBERNETES_SERVICE_PORT")
	if host != "" && port != "" {
		tokenPath := "/var/run/secrets/kubernetes.io/serviceaccount/token"
		caPath := "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"

		if _, err := os.Stat(tokenPath); err == nil {
			tokenBytes, _ := os.ReadFile(tokenPath)
			token := strings.TrimSpace(string(tokenBytes))

			connFlags := []string{
				fmt.Sprintf("--server=https://%s:%s", host, port),
				fmt.Sprintf("--certificate-authority=%s", caPath),
				fmt.Sprintf("--token=%s", token),
			}

			newParts := append([]string{parts[0]}, connFlags...)
			parts = append(newParts, parts[1:]...)
		}
	}

	// Impersonate the user if they are not an admin
	isAdmin := user.Role == "kview-cluster-admin" || user.Role == "admin"
	if !isAdmin && user.Email != "" {
		// Append --as=<email> to the end of the command arguments to avoid plugin parser errors
		impersonateFlag := fmt.Sprintf("--as=%s", user.Email)
		parts = append(parts, impersonateFlag)
	}

	out, err := exec.Command(parts[0], parts[1:]...).CombinedOutput()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return string(out), exitErr.ExitCode()
		}
		return fmt.Sprintf("error: %v", err), 1
	}
	return string(out), 0
}
