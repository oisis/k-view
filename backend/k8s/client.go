package k8s

import (
	"context"
	"io"

	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/dynamic"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

// UserContext represents the impersonation context for a request.
type UserContext struct {
	Email string
	Role  string
}

// KubernetesProvider is the interface that wraps all Kubernetes operations.
type KubernetesProvider interface {
	ListPods(ctx context.Context, namespace string) ([]corev1.Pod, error)
	ListNamespaces(ctx context.Context) ([]string, error)
	ListNodes(ctx context.Context) ([]corev1.Node, error)
	Exec(ctx context.Context, namespace, pod, container string, pty PtyHandler) error
	GetPodLogs(ctx context.Context, namespace, pod, container string, tailLines int64) (string, error)
	GetPodMetrics(ctx context.Context, namespace, pod string) (map[string]interface{}, error)
	ListPodMetrics(ctx context.Context, namespace string) ([]unstructured.Unstructured, error)
	ListNodeMetrics(ctx context.Context) ([]unstructured.Unstructured, error)
	ListAllPods(ctx context.Context) ([]corev1.Pod, error)
	ListAllNodes(ctx context.Context) ([]corev1.Node, error)
	GetNode(ctx context.Context, name string) (*corev1.Node, error)
	GetDynamicClient(ctx context.Context) (dynamic.Interface, error)

	// Network related methods
	GetPod(ctx context.Context, namespace, name string) (*corev1.Pod, error)
	GetService(ctx context.Context, namespace, name string) (*corev1.Service, error)
	GetIngress(ctx context.Context, namespace, name string) (*netv1.Ingress, error)
	ListServices(ctx context.Context, namespace string) ([]corev1.Service, error)
	ListIngresses(ctx context.Context, namespace string) ([]netv1.Ingress, error)
}

// ---- Real Client ----

type Client struct {
	baseConfig *rest.Config
}

func NewClient() (*Client, error) {
	// Try in-cluster config first, then fall back to kubeconfig
	config, err := rest.InClusterConfig()
	if err != nil {
		return nil, err
	}
	return &Client{baseConfig: config}, nil
}

func (c *Client) GetConfig(ctx context.Context) *rest.Config {
	config := rest.CopyConfig(c.baseConfig)
	if user, ok := ctx.Value("user").(UserContext); ok && user.Email != "" {
		isAdmin := user.Role == "kview-cluster-admin" || user.Role == "admin"
		if !isAdmin {
			config.Impersonate = rest.ImpersonationConfig{
				UserName: user.Email,
			}
		}
	}
	return config
}

func (c *Client) getClientset(ctx context.Context) (*kubernetes.Clientset, error) {
	return kubernetes.NewForConfig(c.GetConfig(ctx))
}

func (c *Client) GetDynamicClient(ctx context.Context) (dynamic.Interface, error) {
	return dynamic.NewForConfig(c.GetConfig(ctx))
}

func (c *Client) ListPods(ctx context.Context, namespace string) ([]corev1.Pod, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	pods, err := clientset.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return pods.Items, nil
}

func (c *Client) ListNamespaces(ctx context.Context) ([]string, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	nsList, err := clientset.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
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
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return nodes.Items, nil
}

func (c *Client) ListAllPods(ctx context.Context) ([]corev1.Pod, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	pods, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return pods.Items, nil
}

func (c *Client) ListAllNodes(ctx context.Context) ([]corev1.Node, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	nodes, err := clientset.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return nodes.Items, nil
}

func (c *Client) GetNode(ctx context.Context, name string) (*corev1.Node, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	return clientset.CoreV1().Nodes().Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) ListPodMetrics(ctx context.Context, namespace string) ([]unstructured.Unstructured, error) {
	dyn, err := c.GetDynamicClient(ctx)
	if err != nil {
		return nil, err
	}

	gvr := schema.GroupVersionResource{
		Group:    "metrics.k8s.io",
		Version:  "v1beta1",
		Resource: "pods",
	}

	var list *unstructured.UnstructuredList
	if namespace != "" {
		list, err = dyn.Resource(gvr).Namespace(namespace).List(ctx, metav1.ListOptions{})
	} else {
		list, err = dyn.Resource(gvr).List(ctx, metav1.ListOptions{})
	}

	if err != nil {
		return nil, nil // Metrics Server not available
	}

	return list.Items, nil
}

func (c *Client) ListNodeMetrics(ctx context.Context) ([]unstructured.Unstructured, error) {
	dyn, err := c.GetDynamicClient(ctx)
	if err != nil {
		return nil, err
	}

	gvr := schema.GroupVersionResource{
		Group:    "metrics.k8s.io",
		Version:  "v1beta1",
		Resource: "nodes",
	}

	list, err := dyn.Resource(gvr).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, nil // Metrics Server not available
	}

	return list.Items, nil
}

func (c *Client) GetPodLogs(ctx context.Context, namespace, pod, container string, tailLines int64) (string, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return "", err
	}

	if tailLines == 0 {
		tailLines = 1000
	}
	req := clientset.CoreV1().Pods(namespace).GetLogs(pod, &corev1.PodLogOptions{
		Container: container,
		TailLines: &tailLines,
	})

	readCloser, err := req.Stream(ctx)
	if err != nil {
		return "", err
	}
	defer readCloser.Close()

	data, err := io.ReadAll(readCloser)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

func (c *Client) GetPodMetrics(ctx context.Context, namespace, pod string) (map[string]interface{}, error) {
	dyn, err := c.GetDynamicClient(ctx)
	if err != nil {
		return nil, err
	}

	gvr := schema.GroupVersionResource{
		Group:    "metrics.k8s.io",
		Version:  "v1beta1",
		Resource: "pods",
	}

	item, err := dyn.Resource(gvr).Namespace(namespace).Get(ctx, pod, metav1.GetOptions{})
	if err != nil {
		return nil, nil // Metrics server not available or pod not found
	}

	return item.Object, nil
}

// Ensure Client satisfies KubernetesProvider at compile time
var _ KubernetesProvider = (*Client)(nil)
