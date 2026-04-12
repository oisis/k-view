package handlers

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"k-view/k8s"
	"k-view/pkg/k8sutils"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/labels"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

type PodHandler struct {
	k8sClient k8s.KubernetesProvider
}

func NewPodHandler(client k8s.KubernetesProvider) *PodHandler {
	return &PodHandler{k8sClient: client}
}

type PodResponse struct {
	Name      string            `json:"name"`
	Namespace string            `json:"namespace"`
	Status    string            `json:"status"`
	Age       string            `json:"age"`
	Labels    map[string]string `json:"labels,omitempty"`
}

// ListPods returns a list of pods in a namespace.
// @Summary List Pods
// @Description Get a list of pods in a specific namespace or all namespaces
// @Tags Workloads
// @Produce json
// @Param namespace query string false "Namespace (use '-' for all namespaces)"
// @Success 200 {array} PodResponse
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/pods [get]
func (h *PodHandler) ListPods(c *gin.Context) {
	namespace := c.Query("namespace")
	if namespace == "-" {
		namespace = ""
	}

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		namespace = rbacNs.(string)
	}

	pods, err := h.k8sClient.ListPods(c.Request.Context(), namespace)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}

	var response []PodResponse
	for _, p := range pods {
		status := string(p.Status.Phase)
		for _, cs := range p.Status.ContainerStatuses {
			if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
				status = cs.State.Waiting.Reason
				break
			}
		}
		response = append(response, PodResponse{
			Name:      p.Name,
			Namespace: p.Namespace,
			Status:    status,
			Age:       p.CreationTimestamp.Time.String(),
			Labels:    p.Labels,
		})
	}

	c.JSON(http.StatusOK, response)
}

// ListNamespaces returns a list of all namespaces.
// @Summary List Namespaces
// @Description Get a list of all namespaces in the cluster
// @Tags Cluster
// @Produce json
// @Success 200 {array} map[string]interface{}
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/namespaces [get]
func (h *PodHandler) ListNamespaces(c *gin.Context) {
	namespaces, err := h.k8sClient.ListNamespaces(c.Request.Context())
	if err != nil {
		log.Printf("ERROR: Failed to list namespaces: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list namespaces: " + k8sutils.SanitizeError(err)})
		return
	}
	c.JSON(http.StatusOK, namespaces)
}

// GetLogs returns the logs for a specific resource.
// @Summary Get Logs
// @Description Get logs for a pod or other workload resource
// @Tags Workloads
// @Produce plain
// @Param kind path string true "Resource Kind (e.g. pods, deployments)"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Param container query string false "Container Name"
// @Param tail query int false "Number of lines to tail" default(1000)
// @Success 200 {string} string "Logs content"
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/logs/{kind}/{namespace}/{name} [get]
func (h *PodHandler) GetLogs(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	if kind == "" { kind = "pods" }
	namespace := c.Param("namespace")
	if namespace == "-" { namespace = "" }
	name := c.Param("name")
	container := c.Query("container")
	tailStr := c.DefaultQuery("tail", "1000")
	tail, _ := strconv.ParseInt(tailStr, 10, 64)

	fmt.Printf("[Debug] GetLogs: kind=%s, name=%s, ns=%s\n", kind, name, namespace)

	// Apply RBAC namespace restriction
	if rbacNs, exists := c.Get("namespace"); exists && rbacNs.(string) != "" {
		if namespace != "" && namespace != rbacNs.(string) {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to namespace " + namespace})
			return
		}
		namespace = rbacNs.(string)
	}

	targetPod := name
	ctx := c.Request.Context()

	// If target is not a pod, resolve it to a pod
	if !strings.HasPrefix(kind, "pod") {
		dyn, err := h.k8sClient.GetDynamicClient(ctx)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dynamic client"})
			return
		}

		gvr := getGVR(kind)
		obj, err := dyn.Resource(gvr).Namespace(namespace).Get(ctx, name, metav1.GetOptions{})
		if err != nil {
			fmt.Printf("[Debug] Source not found: %v\n", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Source resource not found"})
			return
		}

		var selector labels.Selector
		if sel, ok, _ := unstructured.NestedMap(obj.Object, "spec", "selector", "matchLabels"); ok {
			sMap := make(map[string]string)
			for k, v := range sel { sMap[k] = fmt.Sprintf("%v", v) }
			selector = labels.SelectorFromSet(sMap)
		} else if sel, ok, _ := unstructured.NestedMap(obj.Object, "spec", "selector"); ok {
			sMap := make(map[string]string)
			for k, v := range sel { sMap[k] = fmt.Sprintf("%v", v) }
			selector = labels.SelectorFromSet(sMap)
		}

		fmt.Printf("[Debug] Using selector: %v\n", selector)
		pods, err := h.k8sClient.ListPods(ctx, namespace)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list pods"})
			return
		}

		found := false
		for _, p := range pods {
			match := false
			if selector != nil && !selector.Empty() {
				if selector.Matches(labels.Set(p.Labels)) { match = true }
			}
			if !match {
				for _, owner := range p.OwnerReferences {
					if owner.Name == name || (owner.UID != "" && string(owner.UID) == string(obj.GetUID())) {
						match = true
						break
					}
				}
			}
			if match {
				targetPod = p.Name
				fmt.Printf("[Debug] Found matching pod: %s\n", targetPod)
				found = true
				break
			}
		}

		if !found && (kind == "cronjobs" || kind == "cronjob") {
			jobsGVR := schema.GroupVersionResource{Group: "batch", Version: "v1", Resource: "jobs"}
			jobsList, _ := dyn.Resource(jobsGVR).Namespace(namespace).List(ctx, metav1.ListOptions{})
			if jobsList != nil {
				for _, j := range jobsList.Items {
					isOwned := false
					for _, owner := range j.GetOwnerReferences() { if owner.Name == name { isOwned = true; break } }
					if isOwned {
						jobName := j.GetName()
						for _, p := range pods {
							for _, pOwner := range p.OwnerReferences {
								if pOwner.Name == jobName {
									targetPod = p.Name
									found = true
									break
								}
							}
							if found { break }
						}
					}
					if found { break }
				}
			}
		}

		if !found {
			fmt.Printf("[Debug] No pods found for %s/%s\n", kind, name)
			c.JSON(http.StatusNotFound, gin.H{"error": "No pods found for this workload"})
			return
		}
	}

	logs, err := h.k8sClient.GetPodLogs(ctx, namespace, targetPod, container, tail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get logs: " + k8sutils.SanitizeError(err)})
		return
	}
	c.String(http.StatusOK, logs)
}
