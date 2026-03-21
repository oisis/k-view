package k8sutils

import (
	"errors"
	"testing"
	"github.com/stretchr/testify/assert"
	k8serrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
)

func TestSanitizeError(t *testing.T) {
	t.Run("Standard K8s NotFound error", func(t *testing.T) {
		err := k8serrors.NewNotFound(schema.GroupResource{Resource: "pods"}, "my-pod")
		sanitized := SanitizeError(err)
		assert.Equal(t, "The requested resource was not found.", sanitized)
	})

	t.Run("IP Address masking", func(t *testing.T) {
		err := errors.New("error at 192.168.1.100")
		sanitized := SanitizeError(err)
		assert.Contains(t, sanitized, "[REDACTED]")
		assert.NotContains(t, sanitized, "192.168.1.100")
	})

	t.Run("Technical error masking", func(t *testing.T) {
		err := errors.New("dial tcp 10.0.0.1:443: i/o timeout")
		sanitized := SanitizeError(err)
		assert.Equal(t, "An internal error occurred while communicating with the cluster.", sanitized)
	})
}
