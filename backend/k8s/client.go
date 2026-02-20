package k8s

import (
	"context"
	"time"

	corev1 "k8s.io/api/core/v1"
	"k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// KubernetesProvider is the interface that wraps all Kubernetes operations.
type KubernetesProvider interface {
	ListPods(ctx context.Context, namespace string) ([]corev1.Pod, error)
	ListNamespaces(ctx context.Context) ([]string, error)
	ListNodes(ctx context.Context) ([]corev1.Node, error)
}

// ---- Real Client ----

type Client struct {
	clientset *kubernetes.Clientset
}

func NewClient() (*Client, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}
	return &Client{clientset: clientset}, nil
}

func (c *Client) ListPods(ctx context.Context, namespace string) ([]corev1.Pod, error) {
	pods, err := c.clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return pods.Items, nil
}

func (c *Client) ListNamespaces(ctx context.Context) ([]string, error) {
	nsList, err := c.clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	var names []string
	for _, ns := range nsList.Items {
		names = append(names, ns.Name)
	}
	return names, nil
}

func (c *Client) ListNodes(ctx context.Context) ([]corev1.Node, error) {
	nodes, err := c.clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return nodes.Items, nil
}

// ---- Mock Client ----

var allMockPods = []corev1.Pod{
	mockPod("frontend-web-5d8f7b", "default", corev1.PodRunning, -10*time.Minute),
	mockPod("backend-api-6c9f8c", "default", corev1.PodRunning, -25*time.Minute),
	mockPod("worker-job-abc12", "default", corev1.PodFailed, -2*time.Hour),
	mockPod("cache-redis-001", "default", corev1.PodRunning, -3*time.Hour),
	mockPod("auth-service-xyz", "auth", corev1.PodRunning, -1*time.Hour),
	mockPod("oauth-proxy-001", "auth", corev1.PodRunning, -30*time.Minute),
	mockPod("pgbouncer-main", "database", corev1.PodRunning, -5*time.Hour),
	mockPod("postgres-primary-0", "database", corev1.PodRunning, -48*time.Hour),
	mockPod("postgres-replica-0", "database", corev1.PodRunning, -48*time.Hour),
	mockPod("kafka-broker-0", "messaging", corev1.PodRunning, -72*time.Hour),
	mockPod("kafka-broker-1", "messaging", corev1.PodRunning, -72*time.Hour),
	mockPod("zookeeper-0", "messaging", corev1.PodRunning, -72*time.Hour),
	mockPod("prometheus-0", "monitoring", corev1.PodRunning, -24*time.Hour),
	mockPod("grafana-7b8c9d", "monitoring", corev1.PodRunning, -24*time.Hour),
	mockPod("alertmanager-0", "monitoring", corev1.PodFailed, -1*time.Hour),
	mockPod("loki-0", "logging", corev1.PodRunning, -24*time.Hour),
	mockPod("fluentbit-ds-abc", "logging", corev1.PodRunning, -48*time.Hour),
	mockPod("ingress-nginx-ctrl", "ingress-nginx", corev1.PodRunning, -96*time.Hour),
	mockPod("cert-manager-abc", "cert-manager", corev1.PodRunning, -96*time.Hour),
	mockPod("coredns-5d78c9b4", "kube-system", corev1.PodRunning, -168*time.Hour),
	mockPod("coredns-7d8f5cf4", "kube-system", corev1.PodRunning, -168*time.Hour),
	mockPod("etcd-master", "kube-system", corev1.PodRunning, -168*time.Hour),
	mockPod("kube-apiserver-m", "kube-system", corev1.PodRunning, -168*time.Hour),
	mockPod("kube-proxy-abc12", "kube-system", corev1.PodRunning, -168*time.Hour),
	mockPod("kube-scheduler-m", "kube-system", corev1.PodRunning, -168*time.Hour),
}

var mockNamespaces = []string{
	"default", "auth", "database", "messaging", "monitoring",
	"logging", "ingress-nginx", "cert-manager",
	"kube-system", "kube-public", "kube-node-lease",
}

func mockNode(name, role, arch string, cpuCores, memGiB int64, ready bool, age time.Duration) corev1.Node {
	conditions := []corev1.NodeCondition{
		{
			Type:   corev1.NodeReady,
			Status: corev1.ConditionFalse,
		},
	}
	if ready {
		conditions[0].Status = corev1.ConditionTrue
	}

	labels := map[string]string{
		"kubernetes.io/arch": arch,
		"kubernetes.io/os":   "linux",
	}
	if role == "control-plane" {
		labels["node-role.kubernetes.io/control-plane"] = ""
		labels["node-role.kubernetes.io/master"] = ""
	} else {
		labels["node-role.kubernetes.io/worker"] = ""
	}

	return corev1.Node{
		ObjectMeta: metav1.ObjectMeta{
			Name:              name,
			Labels:            labels,
			CreationTimestamp: metav1.NewTime(time.Now().Add(age)),
		},
		Status: corev1.NodeStatus{
			Conditions: conditions,
			Capacity: corev1.ResourceList{
				corev1.ResourceCPU:    *resource.NewQuantity(cpuCores, resource.DecimalSI),
				corev1.ResourceMemory: *resource.NewQuantity(memGiB*1024*1024*1024, resource.BinarySI),
			},
			Allocatable: corev1.ResourceList{
				corev1.ResourceCPU:    *resource.NewMilliQuantity((cpuCores*1000)-200, resource.DecimalSI),
				corev1.ResourceMemory: *resource.NewQuantity((memGiB-1)*1024*1024*1024, resource.BinarySI),
			},
			NodeInfo: corev1.NodeSystemInfo{
				KubeletVersion:          "v1.29.3",
				ContainerRuntimeVersion: "containerd://1.7.13",
				OSImage:                 "Alpine Linux v3.19",
				Architecture:            arch,
			},
		},
	}
}

var allMockNodes = []corev1.Node{
	mockNode("master-01", "control-plane", "arm64", 4, 8, true, -720*time.Hour),
	mockNode("master-02", "control-plane", "arm64", 4, 8, true, -720*time.Hour),
	mockNode("master-03", "control-plane", "arm64", 4, 8, true, -720*time.Hour),
	mockNode("worker-01", "worker", "arm64", 8, 32, true, -500*time.Hour),
	mockNode("worker-02", "worker", "arm64", 8, 32, true, -500*time.Hour),
	mockNode("worker-03", "worker", "arm64", 16, 64, true, -250*time.Hour),
	mockNode("worker-04", "worker", "amd64", 16, 64, false, -10*time.Hour), // NotReady
}

func mockPod(name, namespace string, phase corev1.PodPhase, age time.Duration) corev1.Pod {
	pod := corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:              name,
			Namespace:         namespace,
			CreationTimestamp: metav1.NewTime(time.Now().Add(age)),
		},
		Status: corev1.PodStatus{Phase: phase},
	}
	if phase == corev1.PodFailed {
		pod.Status.ContainerStatuses = []corev1.ContainerStatus{
			{State: corev1.ContainerState{
				Waiting: &corev1.ContainerStateWaiting{Reason: "CrashLoopBackOff"},
			}},
		}
	}
	return pod
}

type MockClient struct{}

func NewMockClient() *MockClient { return &MockClient{} }

func (m *MockClient) ListPods(_ context.Context, namespace string) ([]corev1.Pod, error) {
	if namespace == "" {
		return allMockPods, nil
	}
	var filtered []corev1.Pod
	for _, p := range allMockPods {
		if p.Namespace == namespace {
			filtered = append(filtered, p)
		}
	}
	return filtered, nil
}

func (m *MockClient) ListNamespaces(_ context.Context) ([]string, error) {
	return mockNamespaces, nil
}

func (m *MockClient) ListNodes(_ context.Context) ([]corev1.Node, error) {
	return allMockNodes, nil
}

// Ensure MockClient satisfies KubernetesProvider at compile time
var _ KubernetesProvider = (*MockClient)(nil)
var _ KubernetesProvider = (*Client)(nil)

// Suppress unused import lint warning
var _ = v1.PodRunning
