package handlers

import (
	"os"
	"time"
	"github.com/gin-gonic/gin"
	"github.com/ulule/limiter/v3"
	mgin "github.com/ulule/limiter/v3/drivers/middleware/gin"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimitMiddleware creates a rate limiter middleware.
func RateLimitMiddleware(requests int64, period time.Duration) gin.HandlerFunc {
	rate := limiter.Rate{
		Period: period,
		Limit:  requests,
	}
	store := memory.NewStore()
	instance := limiter.New(store, rate)
	return mgin.NewMiddleware(instance)
}

// SecurityHeadersMiddleware adds security-related HTTP headers to every response.
func SecurityHeadersMiddleware() gin.HandlerFunc {
	devMode := os.Getenv("DEV_MODE") == "true"

	return func(c *gin.Context) {
		// Prevent Clickjacking
		c.Header("X-Frame-Options", "DENY")

		// Prevent MIME-sniffing
		c.Header("X-Content-Type-Options", "nosniff")

		// Control how much information is shared in the Referer header
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Disable unused browser features
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

		// Content Security Policy
		// - default-src 'self': only allow content from our own domain by default
		// - script-src 'self' 'unsafe-inline' 'unsafe-eval': allow our scripts, inline theme script, and eval for some UI libs
		// - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com: allow our styles, Tailwind inline styles, and Google Fonts
		// - font-src 'self' https://fonts.gstatic.com: allow local and Google fonts
		// - img-src 'self' data: blob:: allow local images and data URIs (icons)
		// - connect-src 'self' ws: wss:: allow API calls and WebSockets
		// - frame-ancestors 'none': prevent embedding in iframes
		csp := "default-src 'self'; " +
			"script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
			"font-src 'self' https://fonts.gstatic.com; " +
			"img-src 'self' data: blob:; " +
			"connect-src 'self' ws: wss:; " +
			"frame-ancestors 'none';"
		
		c.Header("Content-Security-Policy", csp)

		// HSTS (Strict-Transport-Security) - only in production
		if !devMode {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		c.Next()
	}
}
