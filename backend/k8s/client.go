package k8s

import (
	"context"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// KubernetesProvider is the interface that wraps all Kubernetes operations.
// This allows for easy swapping between a real client and a mock for dev mode.
type KubernetesProvider interface {
	ListPods(ctx context.Context, namespace string) ([]corev1.Pod, error)
}

// ---- Real Client ----

// Client is the real Kubernetes client that uses client-go.
type Client struct {
	clientset *kubernetes.Clientset
}

func NewClient() (*Client, error) {
	// Use in-cluster configuration (service account token)
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

// ---- Mock Client ----

// MockClient returns hardcoded data for local development without a real cluster.
type MockClient struct{}

func NewMockClient() *MockClient {
	return &MockClient{}
}

func (m *MockClient) ListPods(_ context.Context, _ string) ([]corev1.Pod, error) {
	now := metav1.NewTime(time.Now().Add(-10 * time.Minute))
	pods := []corev1.Pod{
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "frontend-pod-abc12",
				Namespace:         "default",
				CreationTimestamp: now,
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "backend-pod-xyz99",
				Namespace:         "default",
				CreationTimestamp: metav1.NewTime(time.Now().Add(-2 * time.Hour)),
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodFailed,
				ContainerStatuses: []corev1.ContainerStatus{
					{
						State: corev1.ContainerState{
							Waiting: &corev1.ContainerStateWaiting{
								Reason: "CrashLoopBackOff",
							},
						},
					},
				},
			},
		},
		{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "database-pod-db01",
				Namespace:         "kube-system",
				CreationTimestamp: metav1.NewTime(time.Now().Add(-48 * time.Hour)),
			},
			Status: corev1.PodStatus{
				Phase: corev1.PodRunning,
			},
		},
	}
	return pods, nil
}
