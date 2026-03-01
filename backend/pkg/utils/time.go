package utils

import (
	"fmt"
	"time"
)

// GetAge calculates the elapsed time since t and returns it in a human-readable format.
func GetAge(t time.Time) string {
	if t.IsZero() {
		return "Unknown"
	}
	d := time.Since(t)
	if d.Hours() > 24 {
		return fmt.Sprintf("%dd", int(d.Hours()/24))
	} else if d.Hours() > 1 {
		return fmt.Sprintf("%dh", int(d.Hours()))
	} else if d.Minutes() > 1 {
		return fmt.Sprintf("%dm", int(d.Minutes()))
	}
	return fmt.Sprintf("%ds", int(d.Seconds()))
}

// ParseK8sTime parses a Kubernetes timestamp string (RFC3339) into time.Time
func ParseK8sTime(s string) time.Time {
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return time.Time{}
	}
	return t
}
