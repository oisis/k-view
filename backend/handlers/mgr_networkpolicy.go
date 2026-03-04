package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type NetworkPolicyManager struct {
	GenericManager
}

func NewNetworkPolicyManager() *NetworkPolicyManager {
	return &NetworkPolicyManager{
		GenericManager: *NewGenericManager(schema.GroupVersionResource{Group: "networking.k8s.io", Version: "v1", Resource: "networkpolicies"}, false),
	}
}

func (m *NetworkPolicyManager) MapItem(item unstructured.Unstructured, metricsMap map[string]unstructured.Unstructured) ResourceItem {
	resItem := m.GenericManager.MapItem(item, metricsMap)
	
	policyTypes, _, _ := unstructured.NestedStringSlice(item.Object, "spec", "policyTypes")
	ingressRules, _, _ := unstructured.NestedSlice(item.Object, "spec", "ingress")
	egressRules, _, _ := unstructured.NestedSlice(item.Object, "spec", "egress")

	resItem.Extra["policyTypes"] = policyTypes
	resItem.Extra["ingressRulesCount"] = len(ingressRules)
	resItem.Extra["egressRulesCount"] = len(egressRules)

	return resItem
}

func (m *NetworkPolicyManager) GetDetails(ctx context.Context, dynClient dynamic.Interface, item unstructured.Unstructured) (gin.H, error) {
	return m.GenericManager.GetDetails(ctx, dynClient, item)
}
