package auth

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v2"
)

// StaticUser represents a user loaded from the environment or config map.
type StaticUser struct {
	Username     string `json:"username" yaml:"username"`
	PasswordHash string `json:"password_hash" yaml:"password_hash"`
}

// LocalAuthenticator handles checking credentials against a local static list.
type LocalAuthenticator struct {
	Users      map[string]StaticUser
	JWTSecret  []byte
}

// NewLocalAuthenticator initializes a new authenticator and loads users.
func NewLocalAuthenticator(jwtSecret string) (*LocalAuthenticator, error) {
	if jwtSecret == "" {
		jwtSecret = os.Getenv("KVIEW_JWT_SECRET")
		if jwtSecret == "" {
			// Fallback generated safely if not set
			jwtSecret = "kview-default-jwt-secret-replace-in-production"
		}
	}

	auth := &LocalAuthenticator{
		Users:     make(map[string]StaticUser),
		JWTSecret: []byte(jwtSecret),
	}

	if err := auth.LoadUsers(); err != nil {
		return nil, fmt.Errorf("failed to load local users: %v", err)
	}

	return auth, nil
}

// LoadUsers loads static users from KVIEW_STATIC_USERS env var or users.yaml
func (a *LocalAuthenticator) LoadUsers() error {
	var usersList []StaticUser

	// 1. Try environment variable first (JSON format)
	envUsers := os.Getenv("KVIEW_STATIC_USERS")
	if envUsers != "" {
		if err := json.Unmarshal([]byte(envUsers), &usersList); err != nil {
			return fmt.Errorf("invalid JSON in KVIEW_STATIC_USERS: %v", err)
		}
	} else {
		// 2. Fallback to YAML file if env is empty
		yamlPath := os.Getenv("KVIEW_AUTH_FILE_PATH")
		if yamlPath == "" {
			yamlPath = "/etc/kview/auth/users.yaml"
		}

		data, err := os.ReadFile(yamlPath)
		if err == nil {
			var yamlConfig struct {
				Users []StaticUser `yaml:"users"`
			}
			if err := yaml.Unmarshal(data, &yamlConfig); err != nil {
				return fmt.Errorf("invalid YAML in %s: %v", yamlPath, err)
			}
			usersList = yamlConfig.Users
		} else if !os.IsNotExist(err) {
			return fmt.Errorf("error reading %s: %v", yamlPath, err)
		}
	}

	// Populate map
	a.Users = make(map[string]StaticUser, len(usersList))
	for _, u := range usersList {
		a.Users[u.Username] = u
	}

	return nil
}

// Authenticate checks if a given plaintext password matches the stored bcrypt hash for the username.
func (a *LocalAuthenticator) Authenticate(username, password string) bool {
	user, exists := a.Users[username]
	if !exists {
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	return err == nil
}

// GenerateJWT creates a new JWT token for a successfully authenticated user.
func (a *LocalAuthenticator) GenerateJWT(username string) (string, error) {
	claims := jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // 24 hours expiry
		"iat":      time.Now().Unix(),
		"iss":      "k-view-auth",
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.JWTSecret)
}

// VerifyJWT checks a token string and returns the username if valid.
func (a *LocalAuthenticator) VerifyJWT(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return a.JWTSecret, nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		if username, ok := claims["username"].(string); ok {
			return username, nil
		}
		return "", fmt.Errorf("jwt missing username claim")
	}

	return "", fmt.Errorf("invalid token claims")
}
