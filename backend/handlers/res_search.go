package handlers

import (
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type SearchResult struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace,omitempty"`
	Kind      string `json:"kind"`
}

func (h *ResourceHandler) Search(c *gin.Context) {
	query := strings.ToLower(c.Query("q"))
	if query == "" {
		c.JSON(http.StatusOK, []SearchResult{})
		return
	}

	// Resources to search in
	kinds := []string{"Pods", "Services", "Deployments", "Nodes", "Namespaces", "ConfigMaps", "Secrets"}
	
	results := make([]SearchResult, 0)
	var mu sync.Mutex
	var wg sync.WaitGroup

	ctx := c.Request.Context()
	dynClient, err := h.k8sClient.GetDynamicClient(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, k := range kinds {
		wg.Add(1)
		go func(kind string) {
			defer wg.Done()
			
			gvr := getGVR(strings.ToLower(kind))
			if gvr.Resource == "" {
				return
			}

			// List all resources of this kind (cluster-wide for search)
			list, err := dynClient.Resource(gvr).List(ctx, metav1.ListOptions{})
			if err != nil {
				return
			}

			for _, item := range list.Items {
				name := item.GetName()
				if strings.Contains(strings.ToLower(name), query) {
					mu.Lock()
					// Limit total results to 50 for performance
					if len(results) >= 50 {
						mu.Unlock()
						return
					}
					results = append(results, SearchResult{
						Name:      name,
						Namespace: item.GetNamespace(),
						Kind:      item.GetKind(),
					})
					mu.Unlock()
				}
			}
		}(k)
	}

	wg.Wait()

	c.JSON(http.StatusOK, results)
}
