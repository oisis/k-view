package k8s

import (
	"context"
	"fmt"
	"log"
	"strings"

	corev1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type TraceNode struct {
	Type      string            `json:"type"` // Ingress, Service, Pod, External
	Name      string            `json:"name"`
	Healthy   bool              `json:"healthy"`
	Message   string            `json:"message"`
	Details   string            `json:"details,omitempty"` // For extra info like hosts/ports
	Labels    map[string]string `json:"labels,omitempty"`
	Selectors map[string]string `json:"selectors,omitempty"`
}

type TraceEdge struct {
	From    string            `json:"from"`
	To      string            `json:"to"`
	Healthy bool              `json:"healthy"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
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

// TraceFlow provides a unified entrypoint for tracing network connections
func TraceFlow(ctx context.Context, client KubernetesProvider, resType, namespace, name string) (*TraceResponse, error) {
	res := &TraceResponse{}
	resType = strings.ToLower(resType)

	switch resType {
	case "ingress", "ingresses":
		ing, err := client.GetIngress(ctx, namespace, name)
		if err != nil {
			return nil, err
		}

		hosts := []string{}
		protocol := "HTTP"
		if len(ing.Spec.TLS) > 0 {
			protocol = "HTTPS"
		}
		for _, rule := range ing.Spec.Rules {
			if rule.Host != "" {
				hosts = append(hosts, rule.Host)
			}
		}

		entryName := "Internet / External User"
		entryDetails := fmt.Sprintf("Protocol: %s\nHosts: %s", protocol, strings.Join(hosts, ", "))
		if len(hosts) == 0 {
			entryDetails = fmt.Sprintf("Protocol: %s\nHosts: <any>", protocol)
		}

		res.Nodes = append(res.Nodes, TraceNode{
			Type:    "External",
			Name:    entryName,
			Healthy: true,
			Message: "Traffic Injection",
			Details: entryDetails,
		})

		res.Nodes = append(res.Nodes, TraceNode{Type: "Ingress", Name: ing.Name, Healthy: true, Message: "Found"})
		res.Edges = append(res.Edges, TraceEdge{From: "External:" + entryName, To: "Ingress:" + ing.Name, Healthy: true, Message: protocol})

		for _, rule := range ing.Spec.Rules {
			if rule.HTTP == nil {
				continue
			}
			for _, path := range rule.HTTP.Paths {
				svcName := path.Backend.Service.Name
				svcPort := path.Backend.Service.Port.Number

				svc, err := client.GetService(ctx, namespace, svcName)
				if err != nil {
					res.Nodes = append(res.Nodes, TraceNode{Type: "Service", Name: svcName, Healthy: false, Message: "Service Not Found"})
					res.Edges = append(res.Edges, TraceEdge{From: "Ingress:" + ing.Name, To: "Service:" + svcName, Healthy: false, Message: "Missing"})
					continue
				}

				res.Nodes = append(res.Nodes, TraceNode{
					Type:      "Service",
					Name:      svcName,
					Healthy:   true,
					Message:   "Found",
					Selectors: svc.Spec.Selector,
				})

				targetPort := ""
				details := make(map[string]string)
				details["Ingress Path"] = path.Path
				if rule.Host != "" {
					details["Ingress Host"] = rule.Host
				}

				for _, p := range svc.Spec.Ports {
					if p.Port == svcPort {
						targetPort = p.TargetPort.String()
						details["Protocol"] = string(p.Protocol)
						details["Service Port"] = fmt.Sprintf("%d", p.Port)
						details["Target Port"] = targetPort
						break
					}
				}
				portMsg := fmt.Sprintf("Port %d", svcPort)
				if targetPort != "" {
					portMsg += " \u2192 " + targetPort
				}

				res.Edges = append(res.Edges, TraceEdge{
					From:    "Ingress:" + ing.Name,
					To:      "Service:" + svcName,
					Healthy: true,
					Message: portMsg,
					Details: details,
				})

				traceServiceToPods(ctx, client, namespace, svc, res)
			}
		}

	case "service", "services":
		svc, err := client.GetService(ctx, namespace, name)
		if err != nil {
			return nil, err
		}
		res.Nodes = append(res.Nodes, TraceNode{
			Type:      "Service",
			Name:      svc.Name,
			Healthy:   true,
			Message:   "Found",
			Selectors: svc.Spec.Selector,
		})

		ings, err := client.ListIngresses(ctx, namespace)
		if err != nil {
			log.Printf("Warning: failed to list ingresses for service trace: %v", err)
		}
		for _, ing := range ings {
			for _, rule := range ing.Spec.Rules {
				if rule.HTTP == nil {
					continue
				}
				for _, path := range rule.HTTP.Paths {
					if path.Backend.Service.Name == svc.Name {
						protocol := "HTTP"
						if len(ing.Spec.TLS) > 0 {
							protocol = "HTTPS"
						}

						entryName := "Internet / External User"
						res.Nodes = append(res.Nodes, TraceNode{
							Type:    "External",
							Name:    entryName,
							Healthy: true,
							Message: "Traffic Source",
							Details: fmt.Sprintf("Host: %s\nProto: %s", rule.Host, protocol),
						})

						res.Nodes = append(res.Nodes, TraceNode{
							Type:    "Ingress",
							Name:    ing.Name,
							Healthy: true,
							Message: "Found",
						})

						details := map[string]string{
							"Protocol":     protocol,
							"Ingress Path": path.Path,
							"Ingress Host": rule.Host,
						}

						// Try to find the port number
						portMsg := protocol
						if path.Backend.Service != nil && path.Backend.Service.Port.Number != 0 {
							portMsg = fmt.Sprintf("Port %d", path.Backend.Service.Port.Number)
						}

						res.Edges = append(res.Edges, TraceEdge{From: "External:" + entryName, To: "Ingress:" + ing.Name, Healthy: true, Message: protocol})
						res.Edges = append(res.Edges, TraceEdge{
							From:    "Ingress:" + ing.Name,
							To:      "Service:" + svc.Name,
							Healthy: true,
							Message: portMsg,
							Details: details,
						})
					}
				}
			}
		}

		traceServiceToPods(ctx, client, namespace, svc, res)

	case "pod", "pods", "deployment", "deployments", "statefulset", "statefulsets", "daemonset", "daemonsets":
		var targetPods []corev1.Pod
		if resType == "pod" || resType == "pods" {
			pod, err := client.GetPod(ctx, namespace, name)
			if err != nil {
				return nil, err
			}
			targetPods = append(targetPods, *pod)
		} else {
			// Workload support (Deployment, StatefulSet, DaemonSet)
			dyn, err := client.GetDynamicClient(ctx)
			if err != nil {
				return nil, err
			}
			
			var gvr schema.GroupVersionResource
			switch {
			case strings.HasPrefix(resType, "deploy"):
				gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "deployments"}
			case strings.HasPrefix(resType, "stateful"):
				gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "statefulsets"}
			case strings.HasPrefix(resType, "daemon"):
				gvr = schema.GroupVersionResource{Group: "apps", Version: "v1", Resource: "daemonsets"}
			}

			workload, err := dyn.Resource(gvr).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
			if err != nil {
				return nil, err
			}

			selector, found, _ := unstructured.NestedMap(workload.Object, "spec", "selector", "matchLabels")
			if !found {
				return nil, fmt.Errorf("workload has no selector")
			}

			// Map selector to string map
			selMap := make(map[string]string)
			for k, v := range selector {
				if s, ok := v.(string); ok {
					selMap[k] = s
				}
			}

			allPods, err := client.ListPods(ctx, namespace)
			if err != nil {
				return nil, err
			}

			for _, p := range allPods {
				if matchesSelector(selMap, p.Labels) {
					targetPods = append(targetPods, p)
				}
			}
		}

		if len(targetPods) == 0 {
			res.Nodes = append(res.Nodes, TraceNode{Type: "Pod", Name: "None", Healthy: false, Message: "No Pods Found"})
			return deduplicateTrace(res), nil
		}

		svcs, err := client.ListServices(ctx, namespace)
		if err != nil {
			log.Printf("Warning: failed to list services for trace: %v", err)
		}
		ings, err := client.ListIngresses(ctx, namespace)
		if err != nil {
			log.Printf("Warning: failed to list ingresses for trace: %v", err)
		}

		for _, pod := range targetPods {
			res.Nodes = append(res.Nodes, TraceNode{
				Type:    "Pod",
				Name:    pod.Name,
				Healthy: pod.Status.Phase == corev1.PodRunning || pod.Status.Phase == corev1.PodSucceeded,
				Message: string(pod.Status.Phase),
				Labels:  pod.Labels,
			})

			for _, svc := range svcs {
				if matchesSelector(svc.Spec.Selector, pod.Labels) {
					res.Nodes = append(res.Nodes, TraceNode{
						Type:      "Service",
						Name:      svc.Name,
						Healthy:   true,
						Message:   "Selects Pod",
						Selectors: svc.Spec.Selector,
					})

					portInfo := ""
					details := make(map[string]string)
					if len(svc.Spec.Ports) > 0 {
						p := svc.Spec.Ports[0]
						portInfo = fmt.Sprintf("%d \u2192 %s", p.Port, p.TargetPort.String())
						details["Service Port"] = fmt.Sprintf("%d", p.Port)
						details["Target Port"] = p.TargetPort.String()
						details["Protocol"] = string(p.Protocol)
						if p.NodePort != 0 {
							details["NodePort"] = fmt.Sprintf("%d", p.NodePort)
						}
					}

					res.Edges = append(res.Edges, TraceEdge{
						From:    "Service:" + svc.Name,
						To:      "Pod:" + pod.Name,
						Healthy: true,
						Message: portInfo,
						Details: details,
					})

					for _, ing := range ings {
						for _, rule := range ing.Spec.Rules {
							if rule.HTTP == nil {
								continue
							}
							for _, path := range rule.HTTP.Paths {
								if path.Backend.Service.Name == svc.Name {
									protocol := "HTTP"
									if len(ing.Spec.TLS) > 0 {
										protocol = "HTTPS"
									}
									entryName := "Internet / External User"
									res.Nodes = append(res.Nodes, TraceNode{
										Type:    "External",
										Name:    entryName,
										Healthy: true,
										Message: "Traffic Source",
										Details: fmt.Sprintf("Host: %s\nProto: %s", rule.Host, protocol),
									})
									res.Nodes = append(res.Nodes, TraceNode{Type: "Ingress", Name: ing.Name, Healthy: true, Message: "Found"})

									edgeDetails := map[string]string{
										"Protocol":     protocol,
										"Ingress Path": path.Path,
										"Ingress Host": rule.Host,
									}

									res.Edges = append(res.Edges, TraceEdge{From: "External:" + entryName, To: "Ingress:" + ing.Name, Healthy: true, Message: protocol})
									res.Edges = append(res.Edges, TraceEdge{
										From:    "Ingress:" + ing.Name,
										To:      "Service:" + svc.Name,
										Healthy: true,
										Message: "Points to Service",
										Details: edgeDetails,
									})
								}
							}
						}
					}
				}
			}
		}
	}

	return deduplicateTrace(res), nil
}

func traceServiceToPods(ctx context.Context, client KubernetesProvider, namespace string, svc *corev1.Service, res *TraceResponse) {
	pods, err := client.ListPods(ctx, namespace)
	if err != nil {
		log.Printf("Warning: failed to list pods for service trace: %v", err)
	}
	matched := 0
	for _, pod := range pods {
		if matchesSelector(svc.Spec.Selector, pod.Labels) {
			matched++
			healthy := pod.Status.Phase == corev1.PodRunning || pod.Status.Phase == corev1.PodSucceeded
			res.Nodes = append(res.Nodes, TraceNode{
				Type:    "Pod",
				Name:    pod.Name,
				Healthy: healthy,
				Message: string(pod.Status.Phase),
				Labels:  pod.Labels,
			})

			portInfo := ""
			details := make(map[string]string)
			if len(svc.Spec.Ports) > 0 {
				p := svc.Spec.Ports[0]
				portInfo = fmt.Sprintf("%d \u2192 %s", p.Port, p.TargetPort.String())
				details["Protocol"] = string(p.Protocol)
				details["Service Port"] = fmt.Sprintf("%d", p.Port)
				details["Target Port"] = p.TargetPort.String()
			}

			res.Edges = append(res.Edges, TraceEdge{
				From:    "Service:" + svc.Name,
				To:      "Pod:" + pod.Name,
				Healthy: true,
				Message: portInfo,
				Details: details,
			})
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
