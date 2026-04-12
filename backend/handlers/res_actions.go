package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"k-view/pkg/k8sutils"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/yaml"
)

type ScaleRequest struct {
	Replicas int `json:"replicas"`
}

// Create creates a new Kubernetes resource.
// @Summary Create Resource
// @Description Create a new Kubernetes resource from a YAML or JSON manifest
// @Tags Resources
// @Accept json
// @Accept plain
// @Produce json
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param body body string true "Resource Manifest (YAML or JSON)"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/resources/{kind}/{namespace} [post]
func (h *ResourceHandler) Create(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	// Read raw body to support both YAML and JSON
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	var raw map[string]interface{}
	if err := yaml.Unmarshal(body, &raw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YAML/JSON: " + err.Error()})
		return
	}

	dynClient, err := h.k8sClient.GetDynamicClient(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}

	gvr := getGVR(kind)
	obj := &unstructured.Unstructured{Object: raw}
	
	var created *unstructured.Unstructured
	if ns != "" {
		created, err = dynClient.Resource(gvr).Namespace(ns).Create(c.Request.Context(), obj, metav1.CreateOptions{})
	} else {
		created, err = dynClient.Resource(gvr).Create(c.Request.Context(), obj, metav1.CreateOptions{})
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}
	c.JSON(http.StatusCreated, created)
}

// Delete deletes a Kubernetes resource.
// @Summary Delete Resource
// @Description Delete a specific Kubernetes resource by kind, namespace, and name
// @Tags Resources
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Success 204
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/resources/{kind}/{namespace}/{name} [delete]
func (h *ResourceHandler) Delete(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := getGVR(kind)
	
	var err error
	if ns != "" {
		err = dynClient.Resource(gvr).Namespace(ns).Delete(c.Request.Context(), name, metav1.DeleteOptions{})
	} else {
		err = dynClient.Resource(gvr).Delete(c.Request.Context(), name, metav1.DeleteOptions{})
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}
	c.Status(http.StatusNoContent)
}

// Scale updates the number of replicas for a workload resource.
// @Summary Scale Resource
// @Description Update the replica count for a Deployment, StatefulSet, or ReplicaSet
// @Tags Resources
// @Accept json
// @Param kind path string true "Resource Kind"
// @Param namespace path string true "Namespace"
// @Param name path string true "Resource Name"
// @Param body body ScaleRequest true "Scale parameters"
// @Success 200
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Security BearerAuth
// @Router /api/resources/{kind}/{namespace}/{name}/scale [patch]
func (h *ResourceHandler) Scale(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")

	var req ScaleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: replicas must be an integer"})
		return
	}

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := getGVR(kind)
	
	// Securely build the patch using a map and json.Marshal
	patchData := map[string]interface{}{
		"spec": map[string]interface{}{
			"replicas": req.Replicas,
		},
	}
	patch, _ := json.Marshal(patchData)

	_, err := dynClient.Resource(gvr).Namespace(ns).Patch(c.Request.Context(), name, types.MergePatchType, patch, metav1.PatchOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}
	c.Status(http.StatusOK)
}

func (h *ResourceHandler) Restart(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := getGVR(kind)
	
	timestamp := time.Now().Format(time.RFC3339)
	
	// Securely build the patch using nested maps and json.Marshal
	patchData := map[string]interface{}{
		"spec": map[string]interface{}{
			"template": map[string]interface{}{
				"metadata": map[string]interface{}{
					"annotations": map[string]interface{}{
						"kubectl.kubernetes.io/restartedAt": timestamp,
					},
				},
			},
		},
	}
	patch, _ := json.Marshal(patchData)
	
	_, err := dynClient.Resource(gvr).Namespace(ns).Patch(c.Request.Context(), name, types.StrategicMergePatchType, patch, metav1.PatchOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
		return
	}
	c.Status(http.StatusOK)
}

func (h *ResourceHandler) UpdateYAML(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	ns := c.Param("namespace")
	if ns == "-" { ns = "" }

	// Read raw body
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	yamlStr := string(body)
	// If it's a JSON body, we might need to extract the "yaml" field
	if strings.HasPrefix(strings.TrimSpace(yamlStr), "{") {
		var bodyObj struct {
			YAML string `json:"yaml"`
		}
		if err := yaml.Unmarshal(body, &bodyObj); err == nil && bodyObj.YAML != "" {
			yamlStr = bodyObj.YAML
		}
	}

	var obj map[string]interface{}
	if err := yaml.Unmarshal([]byte(yamlStr), &obj); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid YAML/JSON format: " + err.Error()})
		return
	}

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())
	gvr := getGVR(kind)
	unstructuredObj := &unstructured.Unstructured{Object: obj}

	if ns != "" {
		_, err = dynClient.Resource(gvr).Namespace(ns).Update(c.Request.Context(), unstructuredObj, metav1.UpdateOptions{})
	} else {
		_, err = dynClient.Resource(gvr).Update(c.Request.Context(), unstructuredObj, metav1.UpdateOptions{})
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Kubernetes API error: " + err.Error()})
		return
	}
	c.Status(http.StatusOK)
}

func (h *ResourceHandler) Trigger(c *gin.Context) {
	kind := strings.ToLower(c.Param("kind"))
	name := c.Param("name")
	ns := c.Param("namespace")

	dynClient, _ := h.k8sClient.GetDynamicClient(c.Request.Context())

	if kind == "cronjobs" {
		cronjobGVR := getGVR("cronjobs")
		jobGVR := getGVR("jobs")

		cj, err := dynClient.Resource(cronjobGVR).Namespace(ns).Get(c.Request.Context(), name, metav1.GetOptions{})
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "CronJob not found"})
			return
		}

		jobTemplate, found, err := unstructured.NestedMap(cj.Object, "spec", "jobTemplate")
		if !found || err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Job template not found in CronJob"})
			return
		}

		newJob := &unstructured.Unstructured{Object: jobTemplate}
		newJob.SetKind("Job")
		newJob.SetAPIVersion("batch/v1")
		newJob.SetName(fmt.Sprintf("%s-manual-%d", name, time.Now().Unix()))
		newJob.SetNamespace(ns)

		_, err = dynClient.Resource(jobGVR).Namespace(ns).Create(c.Request.Context(), newJob, metav1.CreateOptions{})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": k8sutils.SanitizeError(err)})
			return
		}
		c.Status(http.StatusCreated)
		return
	}

	// Default fallback for triggering other resources (if applicable)
	c.JSON(http.StatusBadRequest, gin.H{"error": "Trigger not supported for this resource type"})
}
