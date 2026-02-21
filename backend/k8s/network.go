package k8s

import (
	"context"
	"fmt"
	"strings"

	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type TraceNode struct {
	Type    string `json:"type"` // Ingress, Service, Pod
	Name    string `json:"name"`
	Healthy bool   `json:"healthy"`
	Message string `json:"message"`
}

type TraceEdge struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Healthy bool   `json:"healthy"`
	Message string `json:"message"`
}

type TraceResponse struct {
	Nodes []TraceNode `json:"nodes"`
	Edges []TraceEdge `json:"edges"`
}

func (c *Client) GetIngress(ctx context.Context, namespace, name string) (*netv1.Ingress, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	return clientset.NetworkingV1().Ingresses(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) GetService(ctx context.Context, namespace, name string) (*corev1.Service, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	return clientset.CoreV1().Services(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) GetPod(ctx context.Context, namespace, name string) (*corev1.Pod, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	return clientset.CoreV1().Pods(namespace).Get(ctx, name, metav1.GetOptions{})
}

func (c *Client) ListServices(ctx context.Context, namespace string) ([]corev1.Service, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	res, err := clientset.CoreV1().Services(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return res.Items, nil
}

func (c *Client) ListIngresses(ctx context.Context, namespace string) ([]netv1.Ingress, error) {
	clientset, err := c.getClientset(ctx)
	if err != nil {
		return nil, err
	}
	res, err := clientset.NetworkingV1().Ingresses(namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, err
	}
	return res.Items, nil
}

// Add mock methods to MockClient
func (m *MockClient) GetIngress(ctx context.Context, namespace, name string) (*netv1.Ingress, error) {
	return nil, fmt.Errorf("ingress %s not found in mock", name)
}
func (m *MockClient) GetService(ctx context.Context, namespace, name string) (*corev1.Service, error) {
	return nil, fmt.Errorf("service %s not found in mock", name)
}
func (m *MockClient) GetPod(ctx context.Context, namespace, name string) (*corev1.Pod, error) {
	for _, p := range allMockPods {
		if p.Name == name && p.Namespace == namespace {
			return &p, nil
		}
	}
	return nil, fmt.Errorf("pod %s not found in mock", name)
}
func (m *MockClient) ListServices(ctx context.Context, namespace string) ([]corev1.Service, error) {
	return []corev1.Service{}, nil // simplify for now
}
func (m *MockClient) ListIngresses(ctx context.Context, namespace string) ([]netv1.Ingress, error) {
	return []netv1.Ingress{}, nil // simplify for now
}

// TraceFlow provides a unified entrypoint for tracing network connections
func TraceFlow(ctx context.Context, provider interface{}, resType, namespace, name string) (*TraceResponse, error) {
	// For simplicity, we cast exactly to *Client here, allowing expansion later.
	client, ok := provider.(*Client)
	if !ok {
		// If mock, return a standard fake trace so we don't break DEV_MODE
		return &TraceResponse{
			Nodes: []TraceNode{
				{Type: "Ingress", Name: "mock-ingress", Healthy: true, Message: "Mock Ingress OK"},
				{Type: "Service", Name: "mock-service", Healthy: true, Message: "Mock Service OK"},
				{Type: "Pod", Name: "mock-pod-1", Healthy: true, Message: "Mock Pod OK"},
			},
			Edges: []TraceEdge{
				{From: "Ingress:mock-ingress", To: "Service:mock-service", Healthy: true, Message: "Port Match"},
				{From: "Service:mock-service", To: "Pod:mock-pod-1", Healthy: true, Message: "Selector Match"},
			},
		}, nil
	}

	res := &TraceResponse{}
	resType = strings.ToLower(resType)

	switch resType {
	case "ingress", "ingresses":
		ing, err := client.GetIngress(ctx, namespace, name)
		if err != nil {
			return nil, err
		}
		res.Nodes = append(res.Nodes, TraceNode{Type: "Ingress", Name: ing.Name, Healthy: true, Message: "Found"})

		for _, rule := range ing.Spec.Rules {
			if rule.HTTP == nil { continue }
			for _, path := range rule.HTTP.Paths {
				svcName := path.Backend.Service.Name
				svcPort := path.Backend.Service.Port.Number // Simplify to just number logic

				svc, err := client.GetService(ctx, namespace, svcName)
				if err != nil {
					res.Nodes = append(res.Nodes, TraceNode{Type: "Service", Name: svcName, Healthy: false, Message: "Service Not Found"})
					res.Edges = append(res.Edges, TraceEdge{From: "Ingress:" + ing.Name, To: "Service:" + svcName, Healthy: false, Message: "Missing"})
					continue
				}

				res.Nodes = append(res.Nodes, TraceNode{Type: "Service", Name: svcName, Healthy: true, Message: "Found"})
				res.Edges = append(res.Edges, TraceEdge{From: "Ingress:" + ing.Name, To: "Service:" + svcName, Healthy: true, Message: fmt.Sprintf("Port %d", svcPort)})

				traceServiceToPods(ctx, client, namespace, svc, res)
			}
		}

	case "service", "services":
		svc, err := client.GetService(ctx, namespace, name)
		if err != nil {
			return nil, err
		}
		res.Nodes = append(res.Nodes, TraceNode{Type: "Service", Name: svc.Name, Healthy: true, Message: "Found"})
		
		// Find Ingresses pointing here
		ings, _ := client.ListIngresses(ctx, namespace)
		for _, ing := range ings {
			for _, rule := range ing.Spec.Rules {
				if rule.HTTP == nil { continue }
				for _, path := range rule.HTTP.Paths {
					if path.Backend.Service.Name == svc.Name {
						res.Nodes = append(res.Nodes, TraceNode{Type: "Ingress", Name: ing.Name, Healthy: true, Message: "Found"})
						res.Edges = append(res.Edges, TraceEdge{From: "Ingress:" + ing.Name, To: "Service:" + svc.Name, Healthy: true, Message: "Points to Service"})
					}
				}
			}
		}

		traceServiceToPods(ctx, client, namespace, svc, res)

	case "pod", "pods":
		pod, err := client.GetPod(ctx, namespace, name)
		if err != nil {
			return nil, err
		}
		res.Nodes = append(res.Nodes, TraceNode{Type: "Pod", Name: pod.Name, Healthy: true, Message: string(pod.Status.Phase)})

		// Find Services picking this pod
		svcs, _ := client.ListServices(ctx, namespace)
		for _, svc := range svcs {
			if matchesSelector(svc.Spec.Selector, pod.Labels) {
				res.Nodes = append(res.Nodes, TraceNode{Type: "Service", Name: svc.Name, Healthy: true, Message: "Selects Pod"})
				res.Edges = append(res.Edges, TraceEdge{From: "Service:" + svc.Name, To: "Pod:" + pod.Name, Healthy: true, Message: "Selector Match"})
				
				// Optional: Trace up to Ingresses here too
			}
		}
	}

	return deduplicateTrace(res), nil
}

func traceServiceToPods(ctx context.Context, client *Client, namespace string, svc *corev1.Service, res *TraceResponse) {
	pods, _ := client.ListPods(ctx, namespace)
	matched := 0
	for _, pod := range pods {
		if matchesSelector(svc.Spec.Selector, pod.Labels) {
			matched++
			healthy := pod.Status.Phase == corev1.PodRunning
			res.Nodes = append(res.Nodes, TraceNode{Type: "Pod", Name: pod.Name, Healthy: healthy, Message: string(pod.Status.Phase)})
			res.Edges = append(res.Edges, TraceEdge{From: "Service:" + svc.Name, To: "Pod:" + pod.Name, Healthy: healthy, Message: "Matches Selector"})
		}
	}
	if matched == 0 {
		res.Nodes = append(res.Nodes, TraceNode{Type: "Pod", Name: "None", Healthy: false, Message: "No Pods Found"})
		res.Edges = append(res.Edges, TraceEdge{From: "Service:" + svc.Name, To: "Pod:None", Healthy: false, Message: "Selector Mismatch"})
	}
}

func matchesSelector(selector, labels map[string]string) bool {
	if len(selector) == 0 {
		return false
	}
	for k, v := range selector {
		if labels[k] != v {
			return false
		}
	}
	return true
}

func deduplicateTrace(res *TraceResponse) *TraceResponse {
	nodeSet := make(map[string]bool)
	var uniqueNodes []TraceNode
	for _, n := range res.Nodes {
		key := n.Type + ":" + n.Name
		if !nodeSet[key] {
			nodeSet[key] = true
			uniqueNodes = append(uniqueNodes, n)
		}
	}
	
	edgeSet := make(map[string]bool)
	var uniqueEdges []TraceEdge
	for _, e := range res.Edges {
		key := e.From + "->" + e.To
		if !edgeSet[key] {
			edgeSet[key] = true
			uniqueEdges = append(uniqueEdges, e)
		}
	}
	
	res.Nodes = uniqueNodes
	res.Edges = uniqueEdges
	return res
}
