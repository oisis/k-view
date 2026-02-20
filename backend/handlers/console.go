package handlers

import (
	"fmt"
	"net/http"
	"os/exec"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

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
			"output": fmt.Sprintf("bash: %s: command not found\nOnly kubectl commands are supported.", strings.Fields(cmd)[0]),
			"exitCode": 127,
		})
		return
	}

	var output string
	var exitCode int

	if h.devMode {
		output, exitCode = mockKubectl(cmd)
	} else {
		output, exitCode = realKubectl(cmd)
	}

	c.JSON(http.StatusOK, gin.H{
		"output":   output,
		"exitCode": exitCode,
	})
}

// realKubectl executes kubectl against the real cluster using the in-cluster service account.
func realKubectl(cmd string) (string, int) {
	parts := strings.Fields(cmd)
	if len(parts) == 0 {
		return "", 0
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

// mockKubectl parses kubectl commands and returns realistic fake output.
func mockKubectl(cmd string) (string, int) {
	parts := strings.Fields(cmd)
	if len(parts) < 2 {
		return kubectlHelp(), 0
	}

	sub := parts[1]
	args := parts[2:]

	// Helper to find flag value like -n or --namespace
	ns := extractFlag(args, "-n", "--namespace")

	switch sub {
	case "get":
		if len(args) == 0 {
			return "error: must specify the type of resource to get", 1
		}
		return mockGet(args[0], ns, args[1:])
	case "describe":
		if len(args) == 0 {
			return "error: must specify the type of resource to describe", 1
		}
		return mockDescribe(args[0], args[1:], ns)
	case "logs":
		return mockLogs(args)
	case "apply":
		return "configured\n(dry-run mode: no real changes applied in DEV_MODE)", 0
	case "delete":
		if len(args) > 1 {
			return fmt.Sprintf("%s \"%s\" deleted", args[0], args[1]), 0
		}
		return "error: resource name required", 1
	case "exec":
		return "error: exec not available in DEV_MODE", 1
	case "version":
		return mockVersion(), 0
	case "cluster-info":
		return mockClusterInfo(), 0
	case "config":
		return mockConfig(args), 0
	case "top":
		if len(args) > 0 && args[0] == "nodes" {
			return mockTopNodes(), 0
		}
		return mockTopPods(ns), 0
	case "api-resources":
		return mockAPIResources(), 0
	default:
		return fmt.Sprintf("error: unknown command %q for \"kubectl\"", sub), 1
	}
}

func mockGet(resource, ns string, extra []string) (string, int) {
	wide := containsFlag(extra, "-o", "wide")
	allNs := containsAny(extra, "-A", "--all-namespaces")
	now := time.Now()

	switch strings.ToLower(resource) {
	case "pods", "pod", "po":
		rows := [][]string{
			{"frontend-web-5d8f7b", "1/1", "Running",          "0", "19h"},
			{"backend-api-6c9f8c",  "1/1", "Running",          "0", "4h"},
			{"worker-job-abc12",    "0/1", "CrashLoopBackOff", "8", "2h"},
			{"cache-redis-001",     "1/1", "Running",          "0", "3h"},
		}
		if allNs || ns == "" {
			// show all pods from all namespaces
			return renderPodsAllNs(wide), 0
		}
		if ns == "kube-system" {
			return renderKubeSystemPods(), 0
		}
		return renderPodTable(rows, ns, wide), 0

	case "nodes", "node", "no":
		return renderNodeTable(wide), 0

	case "namespaces", "namespace", "ns":
		lines := []string{
			"NAME              STATUS   AGE",
			"default           Active   30d",
			"auth              Active   30d",
			"database          Active   25d",
			"messaging         Active   20d",
			"monitoring        Active   28d",
			"logging           Active   28d",
			"ingress-nginx     Active   30d",
			"cert-manager      Active   30d",
			"kube-system       Active   30d",
			"kube-public       Active   30d",
			"kube-node-lease   Active   30d",
		}
		return strings.Join(lines, "\n"), 0

	case "deployments", "deployment", "deploy":
		lines := []string{
			"NAME             READY   UP-TO-DATE   AVAILABLE   AGE",
			"frontend-web     3/3     3            3           30d",
			"backend-api      2/2     2            2           30d",
			"cache-redis      1/1     1            1           30d",
		}
		return strings.Join(lines, "\n"), 0

	case "services", "service", "svc":
		lines := []string{
			"NAME           TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE",
			"kubernetes     ClusterIP   10.96.0.1       <none>        443/TCP    30d",
			"frontend-svc   ClusterIP   10.96.12.34     <none>        80/TCP     30d",
			"backend-svc    ClusterIP   10.96.56.78     <none>        8080/TCP   30d",
		}
		return strings.Join(lines, "\n"), 0

	case "events", "event":
		_ = now
		lines := []string{
			"LAST SEEN   TYPE      REASON              OBJECT                         MESSAGE",
			"2m          Warning   BackOff             pod/worker-job-abc12           Back-off restarting failed container",
			"5m          Normal    Pulled              pod/frontend-web-5d8f7b        Successfully pulled image",
			"10m         Normal    Scheduled           pod/backend-api-6c9f8c         Successfully assigned default/backend-api-6c9f8c to worker-02",
		}
		return strings.Join(lines, "\n"), 0

	case "configmaps", "configmap", "cm":
		lines := []string{
			"NAME               DATA   AGE",
			"kube-root-ca.crt   1      30d",
			"app-config         5      10d",
		}
		return strings.Join(lines, "\n"), 0

	case "secrets", "secret":
		lines := []string{
			"NAME                  TYPE                                  DATA   AGE",
			"default-token-abc12   kubernetes.io/service-account-token   3      30d",
			"app-tls-secret        kubernetes.io/tls                     2      15d",
		}
		return strings.Join(lines, "\n"), 0

	default:
		return fmt.Sprintf("error: the server doesn't have a resource type %q", resource), 1
	}
}

func mockDescribe(resource string, args []string, ns string) (string, int) {
	name := ""
	if len(args) > 0 {
		name = args[0]
	}
	switch strings.ToLower(resource) {
	case "pod", "pods":
		if name == "" {
			return "error: resource name required", 1
		}
		return fmt.Sprintf(`Name:         %s
Namespace:    %s
Node:         worker-01/10.0.0.1
Start Time:   %s
Labels:       app=%s
Status:       Running
IP:           10.244.1.5
Containers:
  app:
    Image:    registry.example.com/%s:latest
    Port:     8080/TCP
    State:    Running
      Started: %s
    Ready:    True
    Restarts: 0
Conditions:
  Ready         True
  Initialized   True
Events:
  Normal  Pulled   5m    kubelet  Successfully pulled image
  Normal  Created  5m    kubelet  Created container app
  Normal  Started  5m    kubelet  Started container app`, name, ns, time.Now().Add(-1*time.Hour).Format(time.RFC1123), name, name, time.Now().Add(-55*time.Minute).Format(time.RFC1123)), 0
	case "node", "nodes":
		return fmt.Sprintf(`Name:               %s
Roles:              worker
Labels:             kubernetes.io/arch=arm64
                    kubernetes.io/os=linux
Conditions:
  Ready   True   kubelet is posting ready status
Capacity:
  cpu:     8
  memory:  32Gi
  pods:    110
Allocatable:
  cpu:     7800m
  memory:  31Gi
  pods:    110
System Info:
  OS:                 Alpine Linux v3.19
  Kernel:             6.6.0
  Container Runtime:  containerd://1.7.13
  Kubelet Version:    v1.29.3`, name), 0
	default:
		return fmt.Sprintf("(mock) describe %s/%s — no further detail available", resource, name), 0
	}
}

func mockLogs(args []string) (string, int) {
	pod := ""
	for _, a := range args {
		if !strings.HasPrefix(a, "-") {
			pod = a
			break
		}
	}
	if pod == "" {
		return "error: pod name required", 1
	}
	return fmt.Sprintf(`[2026-02-20T22:01:00Z] INFO  Starting %s
[2026-02-20T22:01:01Z] INFO  Configuration loaded
[2026-02-20T22:01:02Z] INFO  Connecting to database... OK
[2026-02-20T22:01:03Z] INFO  Server listening on :8080
[2026-02-20T22:01:05Z] INFO  GET /health 200 4ms
[2026-02-20T22:01:10Z] INFO  GET /api/v1/data 200 12ms
[2026-02-20T22:10:00Z] WARN  High memory usage: 78%%
[2026-02-20T22:15:42Z] INFO  GET /api/v1/data 200 9ms`, pod), 0
}

func mockVersion() string {
	return `Client Version: v1.29.3
Kustomize Version: v5.0.4-0.20230601165947-6ce0bf390ce3
Server Version: v1.29.3`
}

func mockClusterInfo() string {
	return `Kubernetes control plane is running at https://10.0.0.1:6443
CoreDNS is running at https://10.0.0.1:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use 'kubectl cluster-info dump'.`
}

func mockConfig(args []string) string {
	if len(args) > 0 && args[0] == "current-context" {
		return "k-view-dev-cluster"
	}
	return `apiVersion: v1
clusters:
- name: k-view-dev-cluster
contexts:
- name: k-view-dev-cluster
  context:
    cluster: k-view-dev-cluster
    user: k-view-sa
current-context: k-view-dev-cluster`
}

func mockTopNodes() string {
	return `NAME        CPU(cores)   CPU%   MEMORY(bytes)   MEMORY%
master-01   123m         3%     1820Mi          22%
master-02   98m          2%     1650Mi          20%
master-03   110m         2%     1700Mi          21%
worker-01   1250m        15%    12500Mi         38%
worker-02   3400m        42%    21800Mi         67%
worker-03   2100m        13%    28000Mi         43%`
}

func mockTopPods(ns string) string {
	header := "NAME                     CPU(cores)   MEMORY(bytes)"
	rows := []string{
		"frontend-web-5d8f7b      12m          45Mi",
		"backend-api-6c9f8c       85m          210Mi",
		"cache-redis-001          5m           128Mi",
		"worker-job-abc12         245m         512Mi",
	}
	return header + "\n" + strings.Join(rows, "\n")
}

func mockAPIResources() string {
	return `NAME                SHORTNAMES   APIVERSION   NAMESPACED   KIND
bindings                         v1           true         Binding
configmaps          cm           v1           true         ConfigMap
endpoints           ep           v1           true         Endpoints
events              ev           v1           true         Event
namespaces          ns           v1           false        Namespace
nodes               no           v1           false        Node
pods                po           v1           true         Pod
secrets                          v1           true         Secret
services            svc          v1           true         Service
deployments         deploy       apps/v1      true         Deployment`
}

func kubectlHelp() string {
	return `kubectl controls the Kubernetes cluster manager.

Basic Commands:
  get           Display one or many resources
  describe      Show details of a specific resource
  logs          Print the logs for a container in a pod
  exec          Execute a command in a container
  apply         Apply a configuration to a resource
  delete        Delete resources

Cluster Management:
  top           Display resource usage
  version       Print the client and server version
  cluster-info  Display cluster information
  config        Modify kubeconfig files

Usage: kubectl [command] [TYPE] [NAME] [flags]`
}

// ---- Rendering helpers ----

func renderPodTable(rows [][]string, ns string, wide bool) string {
	header := "NAME                     READY   STATUS             RESTARTS   AGE"
	if wide {
		header += "   IP             NODE"
	}
	var lines []string
	lines = append(lines, header)
	for _, r := range rows {
		line := fmt.Sprintf("%-25s  %-6s  %-18s %-10s %s", r[0], r[1], r[2], r[3], r[4])
		if wide {
			line += "   10.244.1.5    worker-01"
		}
		lines = append(lines, line)
	}
	return strings.Join(lines, "\n")
}

func renderPodsAllNs(wide bool) string {
	header := "NAMESPACE       NAME                     READY   STATUS             RESTARTS   AGE"
	rows := []string{
		"default         frontend-web-5d8f7b      1/1     Running            0          19h",
		"default         backend-api-6c9f8c       1/1     Running            0          4h",
		"default         worker-job-abc12         0/1     CrashLoopBackOff   8          2h",
		"auth            auth-service-xyz         1/1     Running            0          1h",
		"auth            oauth-proxy-001          1/1     Running            0          30m",
		"database        postgres-primary-0       1/1     Running            0          2d",
		"database        postgres-replica-0       1/1     Running            0          2d",
		"monitoring      prometheus-0             1/1     Running            0          1d",
		"monitoring      alertmanager-0           0/1     CrashLoopBackOff   3          1h",
		"kube-system     coredns-5d78c9b4         1/1     Running            0          7d",
		"kube-system     kube-proxy-abc12         1/1     Running            0          7d",
	}
	return header + "\n" + strings.Join(rows, "\n")
}

func renderNodeTable(wide bool) string {
	header := "NAME        STATUS   ROLES           AGE   VERSION"
	if wide {
		header += "   INTERNAL-IP   OS-IMAGE             KERNEL-VERSION   CONTAINER-RUNTIME"
	}
	rows := []string{
		"master-01   Ready    control-plane   30d   v1.29.3",
		"master-02   Ready    control-plane   30d   v1.29.3",
		"master-03   Ready    control-plane   30d   v1.29.3",
		"worker-01   Ready    worker          20d   v1.29.3",
		"worker-02   Ready    worker          20d   v1.29.3",
		"worker-03   Ready    worker          10d   v1.29.3",
		"worker-04   NotReady worker          <10h  v1.29.3",
	}
	if wide {
		rows = []string{
			"master-01   Ready    control-plane   30d   v1.29.3   10.0.0.1   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"master-02   Ready    control-plane   30d   v1.29.3   10.0.0.2   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"master-03   Ready    control-plane   30d   v1.29.3   10.0.0.3   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"worker-01   Ready    worker          20d   v1.29.3   10.0.1.1   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"worker-02   Ready    worker          20d   v1.29.3   10.0.1.2   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"worker-03   Ready    worker          10d   v1.29.3   10.0.1.3   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
			"worker-04   NotReady worker          <10h  v1.29.3   10.0.1.4   Alpine Linux v3.19   6.6.0   containerd://1.7.13",
		}
	}
	return header + "\n" + strings.Join(rows, "\n")
}

func renderKubeSystemPods() string {
	header := "NAME                        READY   STATUS    RESTARTS   AGE"
	rows := []string{
		"coredns-5d78c9b4            1/1     Running   0          7d",
		"coredns-7d8f5cf4            1/1     Running   0          7d",
		"etcd-master                 1/1     Running   0          7d",
		"kube-apiserver-m            1/1     Running   0          7d",
		"kube-proxy-abc12            1/1     Running   0          7d",
		"kube-scheduler-m            1/1     Running   0          7d",
	}
	return header + "\n" + strings.Join(rows, "\n")
}

// ---- Flag helpers ----

func extractFlag(args []string, short, long string) string {
	for i, a := range args {
		if (a == short || a == long) && i+1 < len(args) {
			return args[i+1]
		}
		if strings.HasPrefix(a, long+"=") {
			return strings.TrimPrefix(a, long+"=")
		}
	}
	return ""
}

func containsFlag(args []string, flag, value string) bool {
	for i, a := range args {
		if a == flag && i+1 < len(args) && args[i+1] == value {
			return true
		}
	}
	return false
}

func containsAny(args []string, flags ...string) bool {
	for _, a := range args {
		for _, f := range flags {
			if a == f {
				return true
			}
		}
	}
	return false
}
