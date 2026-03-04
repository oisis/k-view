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

	// Fetch related endpoints safely using the same user context
	endpointsGVR := schema.GroupVersionResource{Group: "", Version: "v1", Resource: "endpoints"}
	epItem, err := dynClient.Resource(endpointsGVR).Namespace(item.GetNamespace()).Get(ctx, item.GetName(), metav1.GetOptions{})
	if err == nil && epItem != nil {
		subsets, _, _ := unstructured.NestedSlice(epItem.Object, "subsets")
		response["relatedEndpoints"] = gin.H{
			"subsets": subsets,
		}
	}

	return response, nil
}
