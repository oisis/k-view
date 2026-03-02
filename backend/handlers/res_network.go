package handlers

import (
	"fmt"
	"strings"

	"k-view/pkg/k8sutils"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapNetwork(item unstructured.Unstructured, kind string, extra map[string]interface{}, resItem *ResourceItem, endpointsMap map[string]string) {
	switch kind {
	case "services":
		if sType, ok, _ := unstructured.NestedString(item.Object, "spec", "type"); ok {
			resItem.Status = sType
		}
		if cip, ok, _ := unstructured.NestedString(item.Object, "spec", "clusterIP"); ok {
			extra["cluster-ip"] = cip
		}

		key := item.GetNamespace() + "/" + item.GetName()
		if epStr, ok := endpointsMap[key]; ok && epStr != "" {
			extra["endpoints"] = epStr
		} else {
			extra["endpoints"] = "—"
		}

		if ingresses, ok, _ := unstructured.NestedSlice(item.Object, "status", "loadBalancer", "ingress"); ok && len(ingresses) > 0 {
			var addrs []string
			for _, ing := range ingresses {
				if i, ok := ing.(map[string]interface{}); ok {
					if ip, ok := i["ip"].(string); ok {
						addrs = append(addrs, ip)
					} else if host, ok := i["hostname"].(string); ok {
						addrs = append(addrs, host)
					}
				}
			}
			extra["external"] = strings.Join(addrs, ", ")
		} else if extIPs, ok, _ := unstructured.NestedSlice(item.Object, "spec", "externalIPs"); ok && len(extIPs) > 0 {
			var ips []string
			for _, ip := range extIPs {
				if s, ok := ip.(string); ok {
					ips = append(ips, s)
				}
			}
			extra["external"] = strings.Join(ips, ", ")
		} else {
			extra["external"] = "—"
		}
		
		// Map Selector for filtering
		if selector, ok, _ := unstructured.NestedMap(item.Object, "spec", "selector"); ok {
			var pairs []string
			for k, v := range selector {
				pairs = append(pairs, fmt.Sprintf("%s=%v", k, v))
			}
			extra["selector"] = strings.Join(pairs, ",")
		}

		extra["labels"] = k8sutils.GetLabels(item.Object)

	case "ingresses":
		if class, ok, _ := unstructured.NestedString(item.Object, "spec", "ingressClassName"); ok {
			extra["class"] = class
		} else if class, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "kubernetes.io/ingress.class"); ok {
			extra["class"] = class
		}

		var hosts []string
		var backends []string

		// Default backend
		if db, found, _ := unstructured.NestedMap(item.Object, "spec", "defaultBackend"); found {
			if svc, ok, _ := unstructured.NestedString(db, "service", "name"); ok {
				backends = append(backends, svc)
			}
		}

		if rules, ok, _ := unstructured.NestedSlice(item.Object, "spec", "rules"); ok {
			for _, r := range rules {
				if rule, ok := r.(map[string]interface{}); ok {
					if host, ok := rule["host"].(string); ok {
						hosts = append(hosts, host)
					}
					if http, ok, _ := unstructured.NestedMap(rule, "http"); ok {
						if paths, ok, _ := unstructured.NestedSlice(http, "paths"); ok {
							for _, p := range paths {
								if path, ok := p.(map[string]interface{}); ok {
									// Support both new (service.name) and old (backend.serviceName) formats
									if svc, ok, _ := unstructured.NestedString(path, "backend", "service", "name"); ok {
										backends = append(backends, svc)
									} else if svc, ok, _ := unstructured.NestedString(path, "backend", "serviceName"); ok {
										backends = append(backends, svc)
									}
								}
							}
						}
					}
				}
			}
		}
		extra["hosts"] = strings.Join(hosts, ", ")
		extra["endpoints"] = strings.Join(backends, ", ")

		var addrs []string
		if ingresses, ok, _ := unstructured.NestedSlice(item.Object, "status", "loadBalancer", "ingress"); ok && len(ingresses) > 0 {
			for _, ing := range ingresses {
				if i, ok := ing.(map[string]interface{}); ok {
					if ip, ok := i["ip"].(string); ok {
						addrs = append(addrs, ip)
					} else if host, ok := i["hostname"].(string); ok {
						addrs = append(addrs, host)
					}
				}
			}
		}
		
		if len(addrs) > 0 {
			extra["address"] = strings.Join(addrs, ", ")
		} else {
			extra["address"] = "pending"
		}

	case "ingress-classes", "ingressclasses":
		if ctrl, ok, _ := unstructured.NestedString(item.Object, "spec", "controller"); ok {
			extra["controller"] = ctrl
		}
		extra["labels"] = k8sutils.GetLabels(item.Object)

	case "network-policies", "networkpolicies":
		if podSel, ok, _ := unstructured.NestedMap(item.Object, "spec", "podSelector", "matchLabels"); ok && len(podSel) > 0 {
			extra["pod-selector"] = fmt.Sprintf("%v", podSel)
		} else {
			extra["pod-selector"] = "<all>"
		}
		if pTypes, ok, _ := unstructured.NestedSlice(item.Object, "spec", "policyTypes"); ok {
			var ts []string
			for _, t := range pTypes {
				if tsStr, ok := t.(string); ok {
					ts = append(ts, tsStr)
				}
			}
			extra["policy-types"] = strings.Join(ts, ", ")
		}
		extra["labels"] = k8sutils.GetLabels(item.Object)
	}
}
