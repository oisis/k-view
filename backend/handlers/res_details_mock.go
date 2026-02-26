package handlers

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func (h *ResourceHandler) getMockDetails(kind, name, ns string, found *ResourceItem) gin.H {
	kindLower := strings.ToLower(kind)
	
	// Base metadata
	metadata := gin.H{
		"name":              name,
		"namespace":         ns,
		"uid":               "ca9146d8-a49b-460e-bdf0-fbb871299ade",
		"creationTimestamp": time.Now().Add(-24 * 151 * time.Hour).Format(time.RFC3339),
		"labels":            gin.H{"app": name, "environment": "dev", "managed-by": "k-view"},
		"annotations":       gin.H{"kview.io/monitored": "true"},
	}

	spec := gin.H{}
	status := gin.H{"phase": found.Status}

	switch kindLower {
	case "pods":
		spec = gin.H{
			"nodeName":           "node-worker-01",
			"restartPolicy":      "Always",
			"serviceAccountName": "default",
			"containers": []gin.H{
				{
					"name":  "main-container",
					"image": found.Extra["images"],
					"ports": []gin.H{{"containerPort": 80, "protocol": "TCP"}},
					"resources": gin.H{
						"requests": gin.H{"cpu": "100m", "memory": "128Mi"},
						"limits":   gin.H{"cpu": "500m", "memory": "512Mi"},
					},
					"livenessProbe": gin.H{
						"httpGet": gin.H{"path": "/healthz", "port": 80},
						"initialDelaySeconds": 15,
						"periodSeconds": 20,
					},
				},
			},
		}
		status = gin.H{
			"phase": found.Status,
			"podIP": "10.244.1.42",
			"qosClass": "Burstable",
			"containerStatuses": []gin.H{
				{
					"name": "main-container",
					"ready": true,
					"restartCount": 0,
					"state": gin.H{"running": gin.H{"startedAt": time.Now().Add(-10 * time.Hour).Format(time.RFC3339)}},
				},
			},
			"conditions": []gin.H{
				{"type": "Ready", "status": "True", "lastTransitionTime": time.Now().Add(-10 * time.Hour).Format(time.RFC3339)},
				{"type": "PodScheduled", "status": "True", "lastTransitionTime": time.Now().Add(-11 * time.Hour).Format(time.RFC3339)},
			},
		}

	case "deployments", "daemonsets", "statefulsets":
		spec = gin.H{
			"replicas": 3,
			"selector": gin.H{"matchLabels": gin.H{"app": name}},
			"template": gin.H{
				"spec": gin.H{
					"containers": []gin.H{
						{
							"name":  "app",
							"image": found.Extra["images"],
						},
					},
				},
			},
		}
		status = gin.H{
			"replicas": 3,
			"readyReplicas": 3,
			"availableReplicas": 3,
			"updatedReplicas": 3,
		}

	case "services":
		spec = gin.H{
			"type": "ClusterIP",
			"clusterIP": "10.96.0.1",
			"ports": []gin.H{
				{"name": "http", "port": 80, "targetPort": 8080, "protocol": "TCP"},
			},
			"selector": gin.H{"app": name},
		}

	case "configmaps", "secrets":
		metadata["data"] = gin.H{
			"config.yaml": "key: value\nmode: production",
			"tags":        "web,api",
		}
	}

	return gin.H{
		"resource": found,
		"metadata": metadata,
		"spec":     spec,
		"status":   status,
	}
}
