package handlers

import (
	"testing"
)

func TestMockResourceList(t *testing.T) {
	h := &ResourceHandler{}

	t.Run("Pods Mockup Data", func(t *testing.T) {
		items := h.mockResourceList("pods", "default")
		if len(items) == 0 {
			t.Fatal("Expected pod mockups, got none")
		}
		
		foundRichPod := false
		for _, it := range items {
			if it.Name == "frontend-web-5d8f7b" {
				foundRichPod = true
				if it.Extra["labels"] == "" || it.Extra["images"] == "" {
					t.Errorf("Pod %s missing labels or images in mockup", it.Name)
				}
			}
		}
		if !foundRichPod {
			t.Error("Specific rich pod mockup not found")
		}
	})

	t.Run("Services Mockup Data", func(t *testing.T) {
		items := h.mockResourceList("services", "default")
		for _, it := range items {
			if it.Name == "kubernetes" {
				if it.Extra["endpoints"] == "" {
					t.Error("Service 'kubernetes' missing endpoints in mockup")
				}
			}
		}
	})

	t.Run("Ingresses Mockup Data", func(t *testing.T) {
		items := h.mockResourceList("ingresses", "default")
		if len(items) == 0 {
			t.Fatal("Expected ingress mockups, got none")
		}
		for _, it := range items {
			if it.Extra["hosts"] == "" || it.Extra["address"] == "" {
				t.Errorf("Ingress %s missing hosts or address in mockup", it.Name)
			}
		}
	})
}
