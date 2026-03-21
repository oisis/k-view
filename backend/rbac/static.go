package rbac

import (
	"fmt"
	"io/ioutil"
	"os"

	"gopkg.in/yaml.v2"
)

type Assignment struct {
	User      string `yaml:"user,omitempty" json:"user,omitempty"`
	Group     string `yaml:"group,omitempty" json:"group,omitempty"`
	Role      string `yaml:"role" json:"role"`
	Namespace string `yaml:"namespace,omitempty" json:"namespace,omitempty"`
}

type RBACConfig struct {
	Assignments []Assignment `yaml:"assignments"`
}

// LoadStaticConfig loads the RBAC configuration from a YAML file.
func LoadStaticConfig(path string) (*RBACConfig, error) {
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return &RBACConfig{}, nil // Return empty config if file doesn't exist
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read rbac config: %v", err)
	}

	var config RBACConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal rbac config: %v", err)
	}

	return &config, nil
}

var roleWeights = map[string]int{
	"kview-cluster-admin":     100,
	"admin":                   90,
	"kview-cluster-developer": 80,
	"kview-namespace-admin":   70,
	"kview-namespace-developer": 60,
	"kview-cluster-viewer":    50,
	"kview-namespace-viewer":  40,
	"viewer":                  10,
}

// GetRoleForUser returns the role and namespace for a given user email and groups.
func (c *RBACConfig) GetRoleForUser(email string, groups []string) (string, string) {
	bestRole := "viewer"
	bestNamespace := ""
	maxWeight := -1

	// 1. Check static assignments for specific user (highest priority)
	for _, a := range c.Assignments {
		if a.User != "" && a.User == email {
			return a.Role, a.Namespace
		}
	}

	// 2. Check static assignments for groups
	for _, group := range groups {
		for _, a := range c.Assignments {
			if a.Group != "" && a.Group == group {
				weight := roleWeights[a.Role]
				if weight > maxWeight {
					maxWeight = weight
					bestRole = a.Role
					bestNamespace = a.Namespace
				}
			}
		}
	}

	return bestRole, bestNamespace
}
