package handlers

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"k-view/rbac"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"context"
)

// devTokenSecret is used to sign dev-mode session tokens. In production this path is never reached.
var devTokenSecret = []byte("kview-dev-secret-not-for-production")

// AuthHandler handles authentication for both OIDC and dev mode.
type AuthHandler struct {
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
	db           *rbac.DB
	devMode      bool
}

// NewAuthHandler creates an AuthHandler. In DEV_MODE, it skips connecting to Google OIDC.
func NewAuthHandler(db *rbac.DB) (*AuthHandler, error) {
	devMode := os.Getenv("DEV_MODE") == "true"

	if devMode {
		return &AuthHandler{db: db, devMode: true}, nil
	}

	ctx := context.Background()
	provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
	if err != nil {
		return nil, err
	}

	clientID := os.Getenv("KVIEW_GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("KVIEW_GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("KVIEW_OAUTH_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/api/auth/callback"
	}

	oidcConfig := &oidc.Config{ClientID: clientID}
	verifier := provider.Verifier(oidcConfig)

	config := oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     provider.Endpoint(),
		RedirectURL:  redirectURL,
		Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
	}

	return &AuthHandler{
		oauth2Config: config,
		verifier:     verifier,
		db:           db,
		devMode:      false,
	}, nil
}

// generateStateOauthCookie generates a random state value and stores it in a cookie.
func generateStateOauthCookie(w http.ResponseWriter) string {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauthstate",
		Value:    state,
		Expires:  time.Now().Add(1 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	return state
}

// Login redirects the user to the Google OIDC login page.
// In dev mode it redirects to the dev-login endpoint instead.
func (h *AuthHandler) Login(c *gin.Context) {
	if h.devMode {
		c.Redirect(http.StatusTemporaryRedirect, "/")
		return
	}
	state := generateStateOauthCookie(c.Writer)
	c.Redirect(http.StatusTemporaryRedirect, h.oauth2Config.AuthCodeURL(state))
}

// Callback handles the OAuth2 callback from Google.
func (h *AuthHandler) Callback(c *gin.Context) {
	if h.devMode {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OIDC callback is disabled in dev mode"})
		return
	}

	state, err := c.Cookie("oauthstate")
	if err != nil || c.Query("state") != state {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid OAuth state"})
		return
	}

	oauth2Token, err := h.oauth2Config.Exchange(c, c.Query("code"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to exchange token: " + err.Error()})
		return
	}

	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No id_token field in oauth2 token."})
		return
	}

	idToken, err := h.verifier.Verify(c, rawIDToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify ID Token: " + err.Error()})
		return
	}

	var claims struct {
		Email string `json:"email"`
	}
	if err := idToken.Claims(&claims); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    rawIDToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})
	_, _ = h.db.GetUserRole(claims.Email)
	c.Redirect(http.StatusTemporaryRedirect, "/")
}

// DevLogin is a special endpoint for dev mode. It issues a signed session token for a mock admin user.
// Returns 403 if DEV_MODE is not active.
func (h *AuthHandler) DevLogin(c *gin.Context) {
	if !h.devMode {
		c.JSON(http.StatusForbidden, gin.H{"error": "Dev login is only available in DEV_MODE"})
		return
	}

	const devEmail = "admin@kview.local"
	const devRole = "admin"

	// Ensure the dev user is in the database with admin role
	if err := h.db.SetUserRole(devEmail, devRole); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set dev user role"})
		return
	}

	// Create a simple signed token: base64(payload).HMAC
	payload, _ := json.Marshal(map[string]string{"email": devEmail})
	encodedPayload := base64.URLEncoding.EncodeToString(payload)
	mac := hmac.New(sha256.New, devTokenSecret)
	mac.Write([]byte(encodedPayload))
	sig := hex.EncodeToString(mac.Sum(nil))
	token := fmt.Sprintf("%s.%s", encodedPayload, sig)

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Path:     "/",
	})

	c.JSON(http.StatusOK, gin.H{"email": devEmail, "role": devRole})
}

// Logout clears the auth cookie.
func (h *AuthHandler) Logout(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	})
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

// Me returns the currently authenticated user's email and role.
func (h *AuthHandler) Me(c *gin.Context) {
	email, exists := c.Get("email")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}
	role, err := h.db.GetUserRole(email.(string))
	if err != nil {
		role = "viewer"
	}
	devMode := h.devMode
	c.JSON(http.StatusOK, gin.H{
		"email":   email,
		"role":    role,
		"devMode": devMode,
	})
}

// verifyDevToken validates a dev-mode session token.
func verifyDevToken(token string) (string, bool) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return "", false
	}
	encodedPayload, sig := parts[0], parts[1]
	mac := hmac.New(sha256.New, devTokenSecret)
	mac.Write([]byte(encodedPayload))
	expectedSig := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		return "", false
	}
	payload, err := base64.URLEncoding.DecodeString(encodedPayload)
	if err != nil {
		return "", false
	}
	var claims map[string]string
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", false
	}
	email, ok := claims["email"]
	return email, ok
}

// AuthMiddleware validates the auth cookie. Supports both real OIDC tokens and dev tokens.
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie("auth_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}

		// In dev mode, try to verify the dev token first
		if h.devMode {
			email, ok := verifyDevToken(tokenStr)
			if ok {
				c.Set("email", email)
				c.Next()
				return
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid dev token"})
			return
		}

		// In production, verify the OIDC token
		idToken, err := h.verifier.Verify(c, tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		var claims struct {
			Email string `json:"email"`
		}
		if err := idToken.Claims(&claims); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid claims"})
			return
		}
		c.Set("email", claims.Email)
		c.Next()
	}
}

// AdminMiddleware ensures the user has the 'admin' role.
func (h *AuthHandler) AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		email, exists := c.Get("email")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}
		role, err := h.db.GetUserRole(email.(string))
		if err != nil || role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}
		c.Set("role", role)
		c.Next()
	}
}
