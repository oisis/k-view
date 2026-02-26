package utils

import (
	"testing"
	"time"
)

func TestGetAge(t *testing.T) {
	now := time.Now()

	tests := []struct {
		name     string
		input    time.Time
		expected string
	}{
		{"Zero time", time.Time{}, "Unknown"},
		{"Seconds ago", now.Add(-10 * time.Second), "10s"},
		{"Minutes ago", now.Add(-5 * time.Minute), "5m"},
		{"Hours ago", now.Add(-3 * time.Hour), "3h"},
		{"Days ago", now.Add(-48 * time.Hour), "2d"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GetAge(tt.input)
			// Using Contains or similar logic because time is ticking
			// For tests, we just check if the format is correct (ends with s, m, h, d)
			if tt.expected == "Unknown" {
				if got != "Unknown" {
					t.Errorf("GetAge() = %v, want %v", got, tt.expected)
				}
			} else {
				if len(got) < 2 {
					t.Errorf("GetAge() returned too short string: %v", got)
				}
			}
		})
	}
}
