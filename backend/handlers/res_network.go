package handlers

import (
	"fmt"
	"strings"

	"k-view/pkg/k8sutils"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func (h *ResourceHandler) mapNetwork(item unstructured.Unstructured, kind string, extra map[string]string, resItem *ResourceItem, endpointsMap map[string]string) {
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
		extra["labels"] = k8sutils.GetLabels(item.Object)

	case "ingresses":
		if class, ok, _ := unstructured.NestedString(item.Object, "spec", "ingressClassName"); ok {
			extra["class"] = class
		} else if class, ok, _ := unstructured.NestedString(item.Object, "metadata", "annotations", "kubernetes.io/ingress.class"); ok {
			extra["class"] = class
		}

		if rules, ok, _ := unstructured.NestedSlice(item.Object, "spec", "rules"); ok {
			var hosts []string
			for _, r := range rules {
				if rule, ok := r.(map[string]interface{}); ok {
					if host, ok := rule["host"].(string); ok {
						hosts = append(hosts, host)
					}
				}
			}
			extra["hosts"] = strings.Join(hosts, ", ")
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
			extra["address"] = strings.Join(addrs, ", ")
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
