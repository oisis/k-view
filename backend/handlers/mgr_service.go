package handlers

import (
	"context"
	"fmt"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type ServiceManager struct {
	GenericManager
}

func NewServiceManager() *ServiceManager {
	return &ServiceManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "", Version: "v1", Resource: "services"}, false),
	}
}

func (m *ServiceManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	clusterIP, _, _ := unstructured.NestedString(item.Object, "spec", "clusterIP")
	svcType, _, _ := unstructured.NestedString(item.Object, "spec", "type")
	selector, _, _ := unstructured.NestedMap(item.Object, "spec", "selector")
	
	ports, _, _ := unstructured.NestedSlice(item.Object, "spec", "ports")
	var portList []interface{}
	var portStrings []string
	for _, p := range ports {
		if port, ok := p.(map[string]interface{}); ok {
			portList = append(portList, gin.H{
				"name": port["name"],
				"port": port["port"],
				"protocol": port["protocol"],
				"targetPort": port["targetPort"],
			})
			pNum, _ := port["port"].(int64)
			if clusterIP != "" && clusterIP != "None" {
				portStrings = append(portStrings, fmt.Sprintf("%s:%d", clusterIP, pNum))
			} else {
				pProto, _ := port["protocol"].(string)
				portStrings = append(portStrings, fmt.Sprintf("%d/%s", pNum, pProto))
			}
		}
	}

	lbIngress, _, _ := unstructured.NestedSlice(item.Object, "status", "loadBalancer", "ingress")
	var externalEndpoints []string
	for _, lbi := range lbIngress {
		if ing, ok := lbi.(map[string]interface{}); ok {
			if ip, ok := ing["ip"].(string); ok {
				externalEndpoints = append(externalEndpoints, ip)
			}
			if host, ok := ing["hostname"].(string); ok {
				externalEndpoints = append(externalEndpoints, host)
			}
		}
	}

	resItem.Extra["clusterIP"] = clusterIP
	resItem.Extra["type"] = svcType
	resItem.Extra["selector"] = selector
	resItem.Extra["ports"] = portList
	resItem.Extra["endpoints"] = portStrings
	resItem.Extra["external"] = externalEndpoints

	resItem.Status = "Active"

	return resItem
}

func (m *ServiceManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	response, err := m.GenericManager.GetDetails(ctx, dynClient, item)
	if err != nil {
		return nil, err
	}

	ns := item.GetNamespace()
	svcName := item.GetName()

	// 1. Related Endpoints (Formatted for Table)
	endpointsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	epItem, err := dynClient.Resource(endpointsGVR).Namespace(ns).Get(ctx, svcName, metav1.GetOptions{})
	if err == nil && epItem != nil {
		var formattedEndpoints []gin.H
		subsets, _, _ := unstructured.NestedSlice(epItem.Object, "subsets")
		for _, s := range subsets {
			if subset, ok := s.(map[string]interface{}); ok {
				var ports string
				if pts, ok := subset["ports"].([]interface{}); ok {
					for _, p := range pts {
						if pMap, ok := p.(map[string]interface{}); ok {
							ports += fmt.Sprintf("%v/%v ", pMap["port"], pMap["protocol"])
						}
					}
				}
				if addrs, ok := subset["addresses"].([]interface{}); ok {
					for _, a := range addrs {
						if aMap, ok := a.(map[string]interface{}); ok {
							formattedEndpoints = append(formattedEndpoints, gin.H{
								"host": aMap["ip"],
								"node": aMap["nodeName"],
								"ports": ports,
								"ready": "True",
							})
						}
					}
				}
			}
		}
		response["relatedEndpoints"] = formattedEndpoints
	}

	// 2. Related Pods (Based on Selector)
	selector, found, _ := unstructured.NestedMap(item.Object, "spec", "selector")
	if found {
		podMgr := NewPodManager()
		var labelSelectors []string
		for k, v := range selector {
			labelSelectors = append(labelSelectors, fmt.Sprintf("%s=%s", k, v))
		}
		listOptions := metav1.ListOptions{LabelSelector: fmt.Sprintf("%s", labelSelectors[0])} // Simplified
		pods, err := dynClient.Resource(podMgr.GetGVR()).Namespace(ns).List(ctx, listOptions)
		if err == nil {
			var relatedPods []ResourceItem
			for _, pod := range pods.Items {
				relatedPods = append(relatedPods, podMgr.MapItem(pod, nil))
			}
			response["relatedPods"] = relatedPods
		}
	}

	// 3. Related Ingresses
	ingMgr := NewIngressManager()
	ingresses, err := dynClient.Resource(ingMgr.GetGVR()).Namespace(ns).List(ctx, metav1.ListOptions{})
	if err == nil {
		var relatedIngresses []ResourceItem
		for _, ing := range ingresses.Items {
			rules, _, _ := unstructured.NestedSlice(ing.Object, "spec", "rules")
			matches := false
			for _, r := range rules {
				if rule, ok := r.(map[string]interface{}); ok {
					if http, ok := rule["http"].(map[string]interface{}); ok {
						if paths, ok := http["paths"].([]interface{}); ok {
							for _, p := range paths {
								if path, ok := p.(map[string]interface{}); ok {
									if b, ok := path["backend"].(map[string]interface{}); ok {
										if s, ok := b["service"].(map[string]interface{}); ok {
											if s["name"] == svcName { matches = true; break }
										}
									}
								}
							}
						}
					}
				}
			}
			if matches {
				relatedIngresses = append(relatedIngresses, ingMgr.MapItem(ing, nil))
			}
		}
		response["relatedIngresses"] = relatedIngresses
	}

	return response, nil
}
