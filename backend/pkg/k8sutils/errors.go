package k8sutils

import (
	"regexp"
	"strings"

	"k8s.io/apimachinery/pkg/api/errors"
)

var (
	ipRegex = regexp.MustCompile(`\b(?:\d{1,3}\.){3}\d{1,3}\b`)
)

// SanitizeError maps raw Kubernetes errors to user-friendly, secure messages.
func SanitizeError(err error) string {
	if err == nil {
		return ""
	}

	// Handle standard K8s API errors
	if statusErr, ok := err.(*errors.StatusError); ok {
		reason := string(statusErr.ErrStatus.Reason)
		switch reason {
		case "NotFound":
			return "The requested resource was not found."
		case "Forbidden":
			return "Access denied: you do not have permission to perform this action."
		case "Unauthorized":
			return "Authentication failed or session expired."
		case "Conflict":
			return "Conflict: the resource has been modified by another process."
		case "BadRequest":
			return "Invalid request: please check your input."
		case "Timeout":
			return "The operation timed out. Please try again."
		}
	}

	errMsg := err.Error()

	// Mask IP addresses
	errMsg = ipRegex.ReplaceAllString(errMsg, "[REDACTED]")

	// Mask common sensitive paths or internal names if they appear
	if strings.Contains(errMsg, "connection refused") {
		return "Failed to connect to the cluster service."
	}

	// If the error is too technical or long, return a generic message
	if len(errMsg) > 200 || strings.Contains(errMsg, "dial tcp") {
		return "An internal error occurred while communicating with the cluster."
	}

	return errMsg
}
