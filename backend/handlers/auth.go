package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"net/http"
	"os"
	"time"

	"k-view/rbac"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type AuthHandler struct {
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
	db           *rbac.DB
}

func NewAuthHandler(db *rbac.DB) (*AuthHandler, error) {
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

	oidcConfig := &oidc.Config{
		ClientID: clientID,
	}
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
		db:           db, // Store it but we will also use a session/cookie
	}, nil
}

func generateStateOauthCookie(w http.ResponseWriter) string {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	cookie := http.Cookie{
		Name:     "oauthstate",
		Value:    state,
		Expires:  time.Now().Add(1 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true in prod with HTTPS
		Path:     "/",
	}
	http.SetCookie(w, &cookie)
	return state
}

func (h *AuthHandler) Login(c *gin.Context) {
	state := generateStateOauthCookie(c.Writer)
	url := h.oauth2Config.AuthCodeURL(state)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *AuthHandler) Callback(c *gin.Context) {
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
		Name  string `json:"name"`
	}
	if err := idToken.Claims(&claims); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Just set the id_token in a cookie for simple session management
	// In a real app we would use a proper session store or JWT
	cookie := http.Cookie{
		Name:     "auth_token",
		Value:    rawIDToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   false, // Set to true if https
		Path:     "/",
	}
	http.SetCookie(c.Writer, &cookie)

	// Insert default "viewer" role if the user doesn't exist
	_, _ = h.db.GetUserRole(claims.Email)

	c.Redirect(http.StatusTemporaryRedirect, "/")
}

func (h *AuthHandler) Logout(c *gin.Context) {
	cookie := http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Path:     "/",
	}
	http.SetCookie(c.Writer, &cookie)
	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

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
	c.JSON(http.StatusOK, gin.H{
		"email": email,
		"role":  role,
	})
}

// Authentication Middleware
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie("auth_token")
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}

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

// Admin Middleware
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
