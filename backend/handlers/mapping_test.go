package handlers

import (
	"testing"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestMapResourceSpecifics(t *testing.T) {
	h := &ResourceHandler{}

	tests := []struct {
		name     string
		kind     string
		obj      map[string]interface{}
		expected []string // Required keys in Extra map
	}{
		{
			name: "CronJob Mapping",
			kind: "cronjobs",
			obj: map[string]interface{}{
				"apiVersion": "batch/v1",
				"kind":       "CronJob",
				"spec": map[string]interface{}{
					"schedule": "*/5 * * * *",
					"jobTemplate": map[string]interface{}{
						"spec": map[string]interface{}{
							"template": map[string]interface{}{
								"spec": map[string]interface{}{
									"containers": []interface{}{
										map[string]interface{}{"image": "busybox"},
									},
								},
							},
						},
					},
				},
			},
			expected: []string{"schedule", "images"},
		},
		{
			name: "Pod Mapping",
			kind: "pods",
			obj: map[string]interface{}{
				"spec": map[string]interface{}{
					"nodeName": "node-1",
					"containers": []interface{}{
						map[string]interface{}{"image": "nginx"},
					},
				},
			},
			expected: []string{"node", "images"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			item := unstructured.Unstructured{Object: tt.obj}
			resItem := &ResourceItem{Extra: make(map[string]string)}
			
			h.mapResourceSpecifics(item, tt.kind, resItem)

			for _, key := range tt.expected {
				if _, ok := resItem.Extra[key]; !ok {
					t.Errorf("Expected key %s missing from Extra map for kind %s", key, tt.kind)
				}
			}
		})
	}
}
