package handlers

import (
	"bytes"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"k-view/rbac"
	"k-view/k8s"
	"k-view/auth"
	"k-view/pkg/audit"
	"k-view/pkg/contextutils"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"golang.org/x/oauth2"
	"context"
)

// devTokenSecret is used to sign dev-mode session tokens. In production this path is never reached.
var devTokenSecret = []byte("kview-dev-secret-not-for-production")

type AuthHandler struct {
	oauth2Config oauth2.Config
	verifier     *oidc.IDTokenVerifier
	rbacConfig   *rbac.RBACConfig
	localAuth       *auth.LocalAuthenticator
	authorizedUsers []string
	devMode         bool
}

// NewAuthHandler creates an AuthHandler. In DEV_MODE, it skips connecting to Google OIDC.
func NewAuthHandler() (*AuthHandler, error) {
	devMode := os.Getenv("DEV_MODE") == "true"

	rbacPath := os.Getenv("RBAC_CONFIG_PATH")
	if rbacPath == "" {
		rbacPath = "/etc/kview/rbac/assignments.yaml"
	}
	rbacConfig, err := rbac.LoadStaticConfig(rbacPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load static rbac: %v", err)
	}

	// Load Authorized Users
	var authorizedUsers []string
	if usersStr := os.Getenv("KVIEW_AUTHORIZED_USERS"); usersStr != "" {
		for _, u := range strings.Split(usersStr, ",") {
			if trimmed := strings.TrimSpace(u); trimmed != "" {
				authorizedUsers = append(authorizedUsers, trimmed)
			}
		}
		fmt.Printf("SSO Whitelist enabled with %d authorized users.\n", len(authorizedUsers))
	}

	// Try initializing Local Authenticator
	fmt.Printf("DEBUG: Loading KVIEW_STATIC_USERS: %s\n", os.Getenv("KVIEW_STATIC_USERS"))
	var localAuth *auth.LocalAuthenticator
	la, err := auth.NewLocalAuthenticator("")
	if err == nil && len(la.Users) > 0 {
		localAuth = la
		fmt.Printf("Local Authentication enabled with %d static users.\n", len(la.Users))
	}

	// SSO Initialization
	var oauth2Config oauth2.Config
	var verifier *oidc.IDTokenVerifier
	enableSSO := os.Getenv("KVIEW_ENABLE_SSO") == "true"

	if enableSSO {
		clientID := os.Getenv("KVIEW_GOOGLE_CLIENT_ID")
		clientSecret := os.Getenv("KVIEW_GOOGLE_CLIENT_SECRET")
		redirectURL := os.Getenv("KVIEW_OAUTH_REDIRECT_URL")

		if clientID != "" && clientSecret != "" {
			ctx := context.Background()
			provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
			if err != nil {
				fmt.Printf("❌ OIDC Provider error: %v\n", err)
			} else {
				if redirectURL == "" {
					redirectURL = "http://localhost:8080/api/auth/callback"
				}

				oidcConfig := &oidc.Config{ClientID: clientID}
				verifier = provider.Verifier(oidcConfig)

				oauth2Config = oauth2.Config{
					ClientID:     clientID,
					ClientSecret: clientSecret,
					Endpoint:     provider.Endpoint(),
					RedirectURL:  redirectURL,
					Scopes:       []string{oidc.ScopeOpenID, "profile", "email"},
				}
				fmt.Printf("✅ Google SSO (OIDC) initialized successfully for ClientID: %s\n", clientID)
			}
		} else {
			fmt.Println("⚠️  OIDC Authentication skipped: KVIEW_GOOGLE_CLIENT_ID or KVIEW_GOOGLE_CLIENT_SECRET is missing.")
		}
	} else {
		fmt.Println("ℹ️  Google SSO (OIDC) disabled via KVIEW_ENABLE_SSO.")
	}

	return &AuthHandler{
		oauth2Config:    oauth2Config,
		verifier:        verifier,
		rbacConfig:      rbacConfig,
		localAuth:       localAuth,
		authorizedUsers: authorizedUsers,
		devMode:         devMode,
	}, nil
}

// generateStateOauthCookie generates a random state value and stores it in a cookie.
func generateStateOauthCookie(w http.ResponseWriter, devMode bool) string {
	b := make([]byte, 16)
	rand.Read(b)
	state := base64.URLEncoding.EncodeToString(b)
	http.SetCookie(w, &http.Cookie{
		Name:     "oauthstate",
		Value:    state,
		Expires:  time.Now().Add(1 * time.Hour),
		HttpOnly: true,
		Secure:   !devMode,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})
	return state
}

// Login redirects the user to the Google OIDC login page.
// In dev mode it redirects to the dev-login endpoint instead.
// @Summary Login
// @Description Redirect to Google OIDC login page
// @Tags Auth
// @Success 307
// @Router /api/auth/login [get]
func (h *AuthHandler) Login(c *gin.Context) {
	if h.verifier == nil {
		if h.devMode {
			c.Redirect(http.StatusTemporaryRedirect, "/")
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "OIDC is not configured"})
		return
	}
	state := generateStateOauthCookie(c.Writer, h.devMode)
	c.Redirect(http.StatusTemporaryRedirect, h.oauth2Config.AuthCodeURL(state))
}

// isAuthorized checks if an email is in the authorizedUsers list.
// If the list is empty, NO ONE is authorized (secure by default).
func (h *AuthHandler) isAuthorized(email string) bool {
	if len(h.authorizedUsers) == 0 {
		return false
	}
	for _, u := range h.authorizedUsers {
		if strings.EqualFold(u, email) {
			return true
		}
	}
	return false
}

// Callback handles the OAuth2 callback from Google.
// @Summary Auth Callback
// @Description Handle Google OIDC callback and issue session cookie
// @Tags Auth
// @Success 307
// @Router /api/auth/callback [get]
func (h *AuthHandler) Callback(c *gin.Context) {
	if h.verifier == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "OIDC is not configured"})
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

	// Whitelist Check
	if !h.isAuthorized(claims.Email) {
		fmt.Printf("UNAUTHORIZED LOGIN ATTEMPT: Google user %s is not in the whitelist.\n", claims.Email)
		c.Redirect(http.StatusTemporaryRedirect, "/?error=unauthorized")
		return
	}

	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    rawIDToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		Secure:   !h.devMode,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})
	c.Redirect(http.StatusTemporaryRedirect, "/")
}

// DevLogin is a special endpoint for dev mode. It issues a signed session token for a mock admin user.
// Returns 403 if DEV_MODE is not active.
// @Summary Dev Login
// @Description Mock login for development (only in DEV_MODE)
// @Tags Auth
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /api/auth/dev-login [post]
func (h *AuthHandler) DevLogin(c *gin.Context) {
	if !h.devMode {
		c.JSON(http.StatusForbidden, gin.H{"error": "Dev login is only available in DEV_MODE"})
		return
	}

	const devEmail = "admin@kview.local"
	const devRole = "kview-cluster-admin"

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
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
	})

	c.JSON(http.StatusOK, gin.H{"email": devEmail, "role": devRole})
}

// Logout clears the auth cookie.
// @Summary Logout
// @Description Clear authentication session
// @Tags Auth
// @Produce json
// @Success 200 {object} map[string]string
// @Router /api/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Expires:  time.Unix(0, 0),
		HttpOnly: true,
		Secure:   !h.devMode,
		SameSite: http.SameSiteLaxMode,
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
	role, _ := h.rbacConfig.GetRoleForUser(email.(string), []string{})
	if role == "" {
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

// AuthMiddleware validates the auth cookie or a Bearer token.
func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var email string
		var groups []string
		var ok bool

		// 0. Check for token query param (used by WebSocket connections which can't set headers)
		if tokenParam := c.Query("token"); tokenParam != "" && h.localAuth != nil {
			username, g, err := h.localAuth.VerifyJWT(tokenParam)
			if err == nil && username != "" {
				email = username
				groups = g
				ok = true
			}
		}

		// 1. Check for Bearer token (Local Authentication JWT)
		if !ok {
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") && h.localAuth != nil {
				tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
				username, g, err := h.localAuth.VerifyJWT(tokenStr)
				if err == nil && username != "" {
					email = username // For static local users, 'email' is just their username string
					groups = g
					ok = true
				}
			}
		}

		// 2. Fallback to Cookie (OIDC or Dev Mode)
		if !ok {
			tokenStr, err := c.Cookie("auth_token")
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
				return
			}

			if h.verifier != nil {
				idToken, err := h.verifier.Verify(c, tokenStr)
				if err == nil {
					var claims struct {
						Email  string   `json:"email"`
						Groups []string `json:"groups"`
					}
					if err := idToken.Claims(&claims); err == nil {
						email = claims.Email
						groups = claims.Groups
						ok = true
					}
				}
			}

			// 3. Fallback to Dev Token if OIDC failed (only if in dev mode)
			if !ok && h.devMode {
				email, ok = verifyDevToken(tokenStr)
			}
		}

		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// Determine Role based on static config
		role, namespace := h.rbacConfig.GetRoleForUser(email, groups)
		
		userCtx := k8s.UserContext{
			Email:  email,
			Role:   role,
			Groups: groups,
		}

		// Store in Gin context for handlers
		c.Set("email", email)
		c.Set("role", role)
		c.Set("namespace", namespace)
		c.Set("groups", groups)
		c.Set("userCtx", userCtx)

		// Also wrap the Go context for downstream K8s calls
		ctx := contextutils.WithUser(c.Request.Context(), userCtx)
		c.Request = c.Request.WithContext(ctx)

		c.Next()
	}
}

// AdminMiddleware ensures the user has the 'kview-cluster-admin' role or 'admin' fallback role.
func (h *AuthHandler) AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			return
		}
		
		roleStr := role.(string)
		if roleStr != "kview-cluster-admin" && roleStr != "admin" {
			email, _ := c.Get("email")
			fmt.Printf("UNAUTHORIZED ACCESS ATTEMPT: User %s with role %s tried to access an admin-only endpoint\n", email, roleStr)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			return
		}
		
		c.Next()
	}
}

// GetRBACConfig returns the loaded static RBAC config.
func (h *AuthHandler) GetRBACConfig() *rbac.RBACConfig {
	return h.rbacConfig
}

// GetProviders returns the available authentication methods to the frontend.
// @Summary Auth Providers
// @Description Get available authentication methods (OIDC, Local, Dev)
// @Tags Auth
// @Produce json
// @Success 200 {object} map[string]bool
// @Router /api/auth/providers [get]
func (h *AuthHandler) GetProviders(c *gin.Context) {
	fmt.Printf("DEBUG: GetProviders called. OIDC: %v, Local: %v, Dev: %v\n", h.verifier != nil, h.localAuth != nil, h.devMode)
	c.JSON(http.StatusOK, gin.H{
		"oidc":  h.verifier != nil, // True if OIDC was successfully initialized
		"local": h.localAuth != nil, // True if static local users are loaded
		"dev":   h.devMode,          // True if running in DEV_MODE
	})
}

type LocalLoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LocalLogin handles traditional username/password authentication.
// @Summary Local Login
// @Description Authenticate with username and password to get a JWT
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LocalLoginRequest true "Credentials"
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/auth/login [post]
func (h *AuthHandler) LocalLogin(c *gin.Context) {
	if h.localAuth == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Local authentication is not enabled"})
		return
	}

	var req LocalLoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	if !h.localAuth.Authenticate(req.Username, req.Password) {
		// Log failed attempts for security tracking
		fmt.Printf("FAILED LOGIN ATTEMPT for user %s\n", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := h.localAuth.GenerateJWT(req.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate session token"})
		return
	}

	fmt.Printf("Local user %s successfully logged in.\n", req.Username)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
	})
}

// AuditMiddleware logs every request with user identity and action details.
func (h *AuthHandler) AuditMiddleware() gin.HandlerFunc {
	auditEnabled := os.Getenv("KVIEW_AUDIT_ENABLED") != "false"
	auditLevel := strings.ToLower(os.Getenv("KVIEW_AUDIT_LEVEL"))
	if auditLevel == "" {
		auditLevel = "full"
	}

	return func(c *gin.Context) {
		if !auditEnabled {
			c.Next()
			return
		}

		start := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		var payload string
		if method == http.MethodPost || method == http.MethodPut || method == http.MethodPatch {
			// Read body for auditing
			if c.Request.Body != nil {
				bodyBytes, err := io.ReadAll(c.Request.Body)
				if err == nil {
					// Restore body for actual handler
					c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

					if strings.Contains(strings.ToLower(path), "/secrets/") {
						payload = "[MASKED]"
					} else {
						// Limit payload size to 4KB
						if len(bodyBytes) > 4096 {
							payload = string(bodyBytes[:4096]) + "... [TRUNCATED]"
						} else {
							payload = string(bodyBytes)
						}
					}
				} else {
					logrus.WithError(err).Warn("Audit: failed to read request body")
				}
			}
		}

		// Process request
		c.Next()

		// After request
		latency := time.Since(start)
		status := c.Writer.Status()
		email, _ := c.Get("email")
		role, _ := c.Get("role")

		fields := logrus.Fields{
			"status":  status,
			"method":  method,
			"path":    path,
			"ip":      c.ClientIP(),
			"latency": latency.String(),
			"user":    email,
			"role":    role,
		}

		if payload != "" {
			fields["payload"] = payload
		}

		// Add to in-memory AuditStore
		audit.GetStore().Add(audit.AuditEntry{
			Timestamp: start,
			User:      fmt.Sprintf("%v", email),
			Role:      fmt.Sprintf("%v", role),
			Method:    method,
			Path:      path,
			Status:    status,
			Latency:   latency.String(),
			IP:        c.ClientIP(),
			Payload:   payload,
		})

		entry := logrus.WithFields(fields)

		isMutation := method == http.MethodPost || method == http.MethodDelete || method == http.MethodPut || method == http.MethodPatch
		isError := status >= 400

		shouldLog := false
		switch auditLevel {
		case "basic":
			shouldLog = isError
		case "mutation":
			shouldLog = isMutation || isError
		case "full":
			shouldLog = true
		default:
			shouldLog = true
		}

		if shouldLog {
			if isMutation {
				entry.Info("Audit: mutation action")
			} else if isError {
				entry.Warn("Audit: failed request")
			} else {
				entry.Info("Audit: read action")
			}
		}
	}
}
