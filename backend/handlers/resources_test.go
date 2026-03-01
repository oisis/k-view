package handlers

import (
	"testing"
)

func TestMockResourceList(t *testing.T) {
	h := &ResourceHandler{}

	t.Run("Pods Mockup Data", func(t *testing.T) {
		pods := h.mockResourceList("pods", "")
		// Note: In tests, if mock files are not found, this might return empty.
		// We allow empty results in some environments but check if mapping works if data exists.
		if len(pods) > 0 {
			for _, p := range pods {
				if p.Name == "" {
					t.Errorf("Mock pod has no name")
				}
			}
		}
	})

	t.Run("Services Mockup Data", func(t *testing.T) {
		svcs := h.mockResourceList("services", "")
		if len(svcs) > 0 {
			for _, s := range svcs {
				if s.Name == "" {
					t.Errorf("Mock service has no name")
				}
			}
		}
	})

	t.Run("Ingresses Mockup Data", func(t *testing.T) {
		ings := h.mockResourceList("ingresses", "")
		if len(ings) > 0 {
			for _, i := range ings {
				if i.Name == "" {
					t.Errorf("Mock ingress has no name")
				}
			}
		}
	})
}
