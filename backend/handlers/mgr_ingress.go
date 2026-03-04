package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type IngressManager struct {
	GenericManager
}

func NewIngressManager() *IngressManager {
	return &IngressManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "ingresses"}, false),
	}
}

func (m *IngressManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	ingressClass, _, _ := unstructured.NestedString(item.Object, "spec", "ingressClassName")
	rules, _, _ := unstructured.NestedSlice(item.Object, "spec", "rules")
	
	var hosts []string
	for _, r := range rules {
		if rule, ok := r.(map[string]interface{}); ok {
			if host, ok := rule["host"].(string); ok {
				hosts = append(hosts, host)
			}
		}
	}

	lbIngress, _, _ := unstructured.NestedSlice(item.Object, "status", "loadBalancer", "ingress")
	var endpoints []string
	for _, lbi := range lbIngress {
		if ing, ok := lbi.(map[string]interface{}); ok {
			if ip, ok := ing["ip"].(string); ok {
				endpoints = append(endpoints, ip)
			}
			if host, ok := ing["hostname"].(string); ok {
				endpoints = append(endpoints, host)
			}
		}
	}

	resItem.Extra["ingressClass"] = ingressClass
	resItem.Extra["hosts"] = hosts
	resItem.Extra["endpoints"] = endpoints
	resItem.Extra["address"] = endpoints

	return resItem
}

func (m *IngressManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
